import { useState, useRef, useEffect } from 'react';
import { chatWithClaude } from '../lib/claude';
import { runQuery } from '../lib/duckdb';

function extractSQL(text) {
    const fenceMatch = text.match(/```sql\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();
    // loose check for inline SELECT
    const selectMatch = text.match(/(SELECT[\s\S]+?;)/i);
    return selectMatch ? selectMatch[1].trim() : null;
}

function SQLResultTable({ rows }) {
    if (!rows || rows.length === 0) return <p className="text-xs text-gray-500 italic">Query returned no results.</p>;
    const cols = Object.keys(rows[0]);
    return (
        <div className="overflow-x-auto mt-2 rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                    <tr>{cols.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold text-gray-600">{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {cols.map((c) => <td key={c} className="px-3 py-1.5 text-gray-700">{row[c] !== null && row[c] !== undefined ? String(row[c]) : '—'}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Message({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {isUser ? 'You' : 'AI'}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                <p className="whitespace-pre-wrap">{msg.displayContent || msg.content}</p>
                {msg.sqlResult !== undefined && <SQLResultTable rows={msg.sqlResult} />}
            </div>
        </div>
    );
}

export default function ChatInterface({ dataProfile, conn }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;
        setInput('');

        const userMsg = { role: 'user', content: text };
        const newHistory = [...messages.filter((m) => m.role !== undefined), userMsg];
        setMessages((prev) => [...prev, { ...userMsg, displayContent: text }]);
        setLoading(true);

        try {
            // Build API messages (only role+content)
            const apiMessages = newHistory.map(({ role, content }) => ({ role, content }));
            const reply = await chatWithClaude(apiMessages, dataProfile);

            let sqlResult;
            const sql = extractSQL(reply);
            if (sql && conn) {
                try {
                    sqlResult = await runQuery(conn, sql);
                } catch (e) {
                    sqlResult = [];
                }
            }

            const assistantMsg = {
                role: 'assistant',
                content: reply,
                displayContent: reply,
                sqlResult,
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch (e) {
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: `Error: ${e.message}`,
                displayContent: `Error: ${e.message}`,
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">Chat with Your Data</span>
                <span className="text-xs text-gray-400 ml-1">— Ask anything about this dataset</span>
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Ask questions about your data</p>
                            <p className="text-xs text-gray-400 mt-1">Try: "Which ward has the highest average LOS?" or "Show me readmitted patients"</p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {['Which ward has the highest LOS?', 'What is the readmission rate?', 'Show top 5 most expensive patients'].map((q) => (
                                <button
                                    key={q}
                                    onClick={() => setInput(q)}
                                    className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all"
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
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-700">AI</div>
                        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="Ask a question about your dataset…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={loading}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                </button>
            </div>
        </div>
    );
}
