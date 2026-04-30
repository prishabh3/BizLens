import { useState, useRef, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from 'recharts';
import { chatWithClaude } from '../lib/claude';
import { runQuery } from '../lib/duckdb';
import { useAnalysisCtx } from '../context/AnalysisContext';

const COLORS = ['#2251FF', '#002D72', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function extractSQL(text) {
  const fenceMatch = text.match(/```sql\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const selectMatch = text.match(/(SELECT[\s\S]+?;)/i);
  return selectMatch ? selectMatch[1].trim() : null;
}

function isNumeric(v) {
  return v !== null && v !== undefined && !isNaN(Number(v)) && String(v).trim() !== '';
}

function SQLResultChart({ rows }) {
  if (!rows || rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  if (cols.length < 2) return null;

  const labelCol = cols[0];
  const numericCols = cols.slice(1).filter((c) => rows.every((r) => isNumeric(r[c])));
  if (numericCols.length === 0) return null;

  const valueCol = numericCols[0];
  const data = rows.slice(0, 20).map((r) => ({
    name: String(r[labelCol]).length > 16 ? String(r[labelCol]).slice(0, 15) + '…' : String(r[labelCol]),
    value: Number(r[valueCol]),
  }));

  const isTimeSeries = /date|time|month|year|period|quarter/i.test(labelCol);
  const ChartComp = isTimeSeries ? LineChart : BarChart;
  const DataComp = isTimeSeries ? Line : Bar;

  return (
    <div className="mt-3">
      <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">{valueCol} by {labelCol}</p>
      <ResponsiveContainer width="100%" height={160}>
        <ChartComp data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={35} />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 11 }}
            formatter={(v) => Number(v).toLocaleString()}
          />
          {isTimeSeries ? (
            <Line type="monotone" dataKey="value" stroke="#2251FF" strokeWidth={2} dot={false} />
          ) : (
            <Bar dataKey="value" radius={0}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          )}
        </ChartComp>
      </ResponsiveContainer>
    </div>
  );
}

function SQLResultTable({ rows }) {
  if (!rows || rows.length === 0) return <p className="text-xs text-gray-500 italic">Query returned no results.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto mt-2 rounded border border-gray-200">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50">
          <tr>{cols.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {cols.map((c) => <td key={c} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{row[c] !== null && row[c] !== undefined ? String(row[c]) : '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdown(text) {
  // Minimal markdown: code blocks, bold, inline code
  return text
    .split(/(```[\s\S]*?```)/g)
    .map((part, i) => {
      if (part.startsWith('```')) {
        const lang = part.match(/^```(\w*)/)?.[1] || '';
        const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre key={i} className="bg-gray-100 rounded p-2 text-xs font-mono overflow-x-auto mt-1 mb-1 whitespace-pre-wrap">
            {code}
          </pre>
        );
      }
      return (
        <span key={i}>
          {part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, j) => {
            if (seg.startsWith('**') && seg.endsWith('**')) return <strong key={j}>{seg.slice(2, -2)}</strong>;
            if (seg.startsWith('`') && seg.endsWith('`')) return <code key={j} className="bg-gray-100 px-1 rounded text-[11px] font-mono">{seg.slice(1, -1)}</code>;
            return seg;
          })}
        </span>
      );
    });
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 text-xs font-bold ${isUser ? 'bg-[#2251FF] text-white' : 'bg-gray-200 text-gray-700'}`}>
        {isUser ? 'You' : 'AI'}
      </div>
      <div className={`max-w-[80%] px-4 py-3 text-sm ${isUser ? 'bg-[#2251FF] text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
        <div className="whitespace-pre-wrap leading-relaxed">
          {isUser ? msg.displayContent || msg.content : renderMarkdown(msg.displayContent || msg.content)}
        </div>
        {msg.sqlResult !== undefined && (
          <>
            <SQLResultChart rows={msg.sqlResult} />
            <SQLResultTable rows={msg.sqlResult} />
          </>
        )}
      </div>
    </div>
  );
}

const FALLBACK_SUGGESTED = [
  'Which category has the highest average value?',
  'Show me the top 5 rows by any numeric column',
  'What is the distribution of values?',
  'Are there any outliers in the data?',
];

function buildSuggestions(dataProfile) {
  if (!dataProfile?.columns) return FALLBACK_SUGGESTED;
  const entries = Object.entries(dataProfile.columns);
  const numeric = entries.filter(([, v]) => v.type === 'numeric').map(([k]) => k);
  const categorical = entries.filter(([, v]) => v.type === 'categorical').map(([k]) => k);
  const date = entries.filter(([, v]) => v.type === 'date').map(([k]) => k);

  const suggestions = [];
  if (categorical[0] && numeric[0])
    suggestions.push(`Which ${categorical[0]} has the highest ${numeric[0]}?`);
  if (numeric[0])
    suggestions.push(`Show me the distribution of ${numeric[0]}`);
  if (date[0] && numeric[0])
    suggestions.push(`How has ${numeric[0]} changed over ${date[0]}?`);
  if (categorical[0])
    suggestions.push(`What are the top 5 ${categorical[0]} by count?`);
  while (suggestions.length < 4)
    suggestions.push(FALLBACK_SUGGESTED[suggestions.length]);
  return suggestions.slice(0, 4);
}

export default function ChatInterface() {
  const { dataProfile, conn } = useAnalysisCtx();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryMsg, setRetryMsg] = useState(null);
  const bottomRef = useRef();
  const suggested = useMemo(() => buildSuggestions(dataProfile), [dataProfile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput('');
    setRetryMsg(null);

    const userMsg = { role: 'user', content: trimmed };
    const newHistory = [...messages.filter((m) => m.role !== undefined), userMsg];
    setMessages((prev) => [...prev, { ...userMsg, displayContent: trimmed }]);
    setLoading(true);

    try {
      const apiMessages = newHistory.map(({ role, content }) => ({ role, content }));
      const reply = await chatWithClaude(apiMessages, dataProfile);

      let sqlResult;
      const sql = extractSQL(reply);
      if (sql && conn) {
        try {
          sqlResult = await runQuery(conn, sql);
        } catch {
          sqlResult = [];
        }
      }

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: reply,
        displayContent: reply,
        sqlResult,
      }]);
    } catch (e) {
      const errMsg = `Error: ${e.message}`;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: errMsg,
        displayContent: errMsg,
      }]);
      setRetryMsg(trimmed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[620px] bg-gray-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold text-gray-700">Data Consultant</span>
        <span className="text-xs text-gray-400 ml-1">— Ask anything. SQL queries auto-execute.</span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-500">Ask questions about your data</p>
              <p className="text-xs text-gray-400 mt-1">SQL queries are auto-executed and charted</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {suggested.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-[#2251FF] hover:text-[#2251FF] transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-700">AI</div>
            <div className="bg-white border border-gray-100 px-4 py-3 flex items-center gap-1.5">
              {[0, 150, 300].map((d) => (
                <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        {retryMsg && !loading && (
          <div className="flex justify-center">
            <button
              onClick={() => sendMessage(retryMsg)}
              className="text-xs text-[#2251FF] border border-[#2251FF] px-4 py-2 hover:bg-blue-50 transition-colors"
            >
              Retry last message
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          aria-label="Chat message"
          className="flex-1 border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#2251FF] bg-gray-50 rounded-none"
          placeholder="Ask a question or request a SQL query…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          className="px-5 py-2.5 bg-[#2251FF] text-white text-sm font-bold hover:bg-[#002D72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
