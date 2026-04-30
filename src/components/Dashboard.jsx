import { useState, useEffect, useCallback } from 'react';
import MetricCards from './MetricCards';
import IssueTree from './IssueTree';
import Hypotheses from './Hypotheses';
import Recommendations from './Recommendations';
import ChatInterface from './ChatInterface';
import ExportButton from './ExportButton';
import DataCharts from './DataCharts';
import Forecasting from './Forecasting';
import SWOTPorter from './SWOTPorter';
import Methodology from './Methodology';
import { useAnalysisCtx } from '../context/AnalysisContext';

const TABS = [
  { id: 'issueTree',       label: 'Issue Tree' },
  { id: 'hypotheses',      label: 'Hypotheses' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'swotPorter',      label: "SWOT & Porter's" },
  { id: 'scenarios',       label: 'Scenarios' },
  { id: 'forecast',        label: 'Forecast' },
  { id: 'charts',          label: 'Data Charts' },
  { id: 'methodology',     label: 'Methodology' },
  { id: 'chat',            label: 'Data Consultant' },
];

function SkeletonCard() {
  return (
    <div className="border border-gray-200 p-6 space-y-4 animate-pulse bg-white" aria-hidden="true">
      <div className="h-4 bg-gray-200 w-1/2" />
      <div className="h-8 bg-gray-200 w-1/3" />
      <div className="h-px bg-gray-200 w-full my-4" />
      <div className="h-3 bg-gray-200 w-2/3" />
    </div>
  );
}

function StreamingBadge({ streamingText }) {
  if (!streamingText) return null;
  const chars = streamingText.length;
  const label =
    chars < 200  ? 'Parsing structure…' :
    chars < 600  ? 'Building KPIs…' :
    chars < 1200 ? 'Generating issue tree…' :
    chars < 2000 ? 'Writing recommendations…' :
    chars < 3000 ? "Assessing SWOT & Porter's…" :
                   'Finalising analysis…';
  return (
    <div className="flex items-center gap-2 text-[12px] text-[#2251FF]" role="status" aria-live="polite">
      <span className="w-1.5 h-1.5 rounded-full bg-[#2251FF] animate-pulse" aria-hidden="true" />
      <span className="font-bold">{label}</span>
    </div>
  );
}

function ShareButton({ onShare }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = onShare();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt('Copy this share link:', url);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share analysis via link"
      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-[12px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? 'Link Copied!' : 'Share'}
    </button>
  );
}

function CommandPalette({ open, onClose, activeTab, onTabChange, onNewAnalysis, onShare }) {
  const [query, setQuery] = useState('');

  const actions = [
    ...TABS.map((t) => ({ id: t.id, label: `Go to: ${t.label}`, group: 'Navigate', action: () => { onTabChange(t.id); onClose(); } })),
    { id: 'new', label: 'Start New Analysis', group: 'Actions', action: () => { onNewAnalysis(); onClose(); } },
    { id: 'share', label: 'Copy Share Link', group: 'Actions', action: () => { onShare?.(); onClose(); } },
  ];

  const filtered = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    if (open) { setQuery(''); setHighlighted(0); }
  }, [open]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  const handleKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { filtered[highlighted]?.action(); }
    if (e.key === 'Escape') onClose();
  }, [open, filtered, highlighted, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!open) return null;

  const groups = ['Navigate', 'Actions'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
          />
          <kbd className="text-[10px] font-mono bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-gray-400">ESC</kbd>
        </div>
        <div className="overflow-y-auto max-h-80" role="listbox">
          {groups.map((group) => {
            const items = filtered.filter((a) => a.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">{group}</p>
                {items.map((item) => {
                  const idx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={idx === highlighted}
                      onClick={item.action}
                      onMouseEnter={() => setHighlighted(idx)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                        idx === highlighted ? 'bg-[#2251FF] text-white' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                      {item.id === activeTab && (
                        <span className={`ml-auto text-[10px] font-bold uppercase tracking-wide ${idx === highlighted ? 'text-blue-200' : 'text-[#2251FF]'}`}>active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-center text-gray-400">No commands match "{query}"</p>
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 bg-gray-50">
          <span className="text-[10px] text-gray-400"><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span className="text-[10px] text-gray-400"><kbd className="font-mono">↵</kbd> select</span>
          <span className="text-[10px] text-gray-400 ml-auto"><kbd className="font-mono">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNewAnalysis, streamingText, onRetry, lastError, onShare }) {
  const { analysisResult, dataProfile, sector } = useAnalysisCtx();
  const [activeTab, setActiveTab] = useState('issueTree');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isLoading = !analysisResult;
  const isStreaming = isLoading && !!streamingText;

  const handleTabKeyDown = useCallback((e, tabId) => {
    const currentIdx = TABS.findIndex((t) => t.id === tabId);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = TABS[(currentIdx + 1) % TABS.length];
      setActiveTab(next.id);
      document.getElementById(`tab-${next.id}`)?.focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = TABS[(currentIdx - 1 + TABS.length) % TABS.length];
      setActiveTab(prev.id);
      document.getElementById(`tab-${prev.id}`)?.focus();
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(TABS[0].id);
      document.getElementById(`tab-${TABS[0].id}`)?.focus();
    }
    if (e.key === 'End') {
      e.preventDefault();
      const last = TABS[TABS.length - 1];
      setActiveTab(last.id);
      document.getElementById(`tab-${last.id}`)?.focus();
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleShare = useCallback(async () => {
    const url = onShare?.();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      prompt('Copy this share link:', url);
    }
  }, [onShare]);

  return (
    <div className="min-h-screen bg-white font-sans-body">
      <div className="h-1.5 w-full bg-[#2251FF]" aria-hidden="true" />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewAnalysis={onNewAnalysis}
        onShare={handleShare}
      />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-serif-heading font-bold text-gray-900 text-xl tracking-tight flex-shrink-0">BizLens</span>
            <div className="h-5 w-px bg-gray-300 hidden sm:block flex-shrink-0" aria-hidden="true" />
            {sector && (
              <span className="hidden sm:inline-block text-[12px] font-bold text-gray-500 uppercase tracking-widest truncate">{sector}</span>
            )}
            {isStreaming && <StreamingBadge streamingText={streamingText} />}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette (⌘K)"
              className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-400 text-[11px] hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="font-mono">⌘K</span>
            </button>
            {analysisResult && onShare && <ShareButton onShare={onShare} />}
            <ExportButton analysisResult={analysisResult} dataProfile={dataProfile} sector={sector} />
            <button
              onClick={onNewAnalysis}
              aria-label="Start a new analysis"
              className="px-4 py-2.5 bg-[#F5F5F5] text-gray-900 text-[12px] font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
            >
              New Analysis
            </button>
          </div>
        </div>
      </header>

      {/* Error recovery banner */}
      {lastError && (
        <div className="max-w-[1400px] mx-auto px-8 pt-6" role="alert">
          <div className="bg-red-50 border border-red-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-800">Analysis encountered an error</p>
              <p className="text-xs text-red-600 mt-0.5">{lastError}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                aria-label="Retry analysis"
                className="ml-4 px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors flex-shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      <main className="max-w-[1400px] mx-auto px-8 py-12 space-y-12">

        {/* Problem Statement + Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="font-serif-heading text-2xl text-gray-900 font-bold mb-4">Core Problem</h2>
            {isLoading ? (
              isStreaming ? (
                <div className="pl-4 border-l-4 border-[#2251FF] py-1">
                  <p className="text-[15px] text-gray-400 italic animate-pulse">Claude is thinking…</p>
                </div>
              ) : <div className="h-24 bg-gray-100 animate-pulse" aria-hidden="true" />
            ) : (
              <p className="text-[16px] text-gray-700 leading-relaxed font-light pl-4 border-l-4 border-[#2251FF] py-1">
                {analysisResult.problemStatement}
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-serif-heading text-2xl text-gray-900 font-bold mb-4">Executive Summary</h2>
            {isLoading ? (
              isStreaming ? (
                <div className="bg-[#F5F5F5] p-6 lg:p-8 min-h-[100px]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-4 h-4 border-2 border-[#2251FF] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span className="text-[13px] text-[#2251FF] font-bold italic">Synthesizing analysis…</span>
                  </div>
                  <p className="text-[12px] text-gray-400 font-mono" aria-live="polite">
                    {streamingText.slice(-120)}
                    <span className="animate-pulse">▌</span>
                  </p>
                </div>
              ) : <div className="h-32 bg-gray-100 animate-pulse" aria-hidden="true" />
            ) : (
              <div className="bg-[#F5F5F5] p-6 lg:p-8">
                <p className="text-[16px] text-gray-700 leading-relaxed">{analysisResult.executiveSummary}</p>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <section aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="font-serif-heading text-2xl text-gray-900 font-bold mb-6">Key Performance Indicators</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-hidden="true">
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : <MetricCards kpis={analysisResult.kpis} />}
        </section>

        {/* Dataset stats strip */}
        {dataProfile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-t border-b border-gray-100" aria-label="Dataset statistics">
            {[
              { label: 'Rows',         value: dataProfile.rowCount?.toLocaleString() },
              { label: 'Columns',      value: dataProfile.columnCount },
              { label: 'Anomalies',    value: dataProfile.anomalies?.length ?? 0 },
              { label: 'Forecast R²',  value: dataProfile.forecast ? dataProfile.forecast.r2.toFixed(3) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-light text-gray-900">{value}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Strategic Analysis Tabs */}
        <section className="pt-4 border-t border-gray-200" aria-labelledby="analysis-heading">
          <h2 id="analysis-heading" className="font-serif-heading text-3xl text-gray-900 font-bold mb-8">Strategic Analysis</h2>

          <div
            className="flex items-center gap-0 border-b border-gray-200 mb-8 overflow-x-auto"
            role="tablist"
            aria-label="Analysis sections"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`px-5 py-4 text-[12px] font-bold uppercase tracking-widest border-b-4 transition-colors -mb-[2px] whitespace-nowrap flex-shrink-0
                  ${activeTab === tab.id
                    ? 'border-[#2251FF] text-[#2251FF]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading analysis">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-50 border border-gray-100 animate-pulse" aria-hidden="true" />
              ))}
              <div className="flex items-center gap-4 py-8">
                <div className="w-5 h-5 border-2 border-[#2251FF] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <p className="font-serif-heading text-[15px] text-[#2251FF] font-bold italic">Synthesizing professional analysis…</p>
              </div>
            </div>
          ) : (
            <div
              id={`tabpanel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className={`p-8 border border-gray-200 ${activeTab === 'chat' ? 'bg-white' : 'bg-[#F5F5F5]'}`}
            >
              {activeTab === 'issueTree'       && <IssueTree issueTree={analysisResult?.issueTree} />}
              {activeTab === 'hypotheses'      && <Hypotheses hypotheses={analysisResult?.hypotheses} />}
              {activeTab === 'recommendations' && <Recommendations recommendations={analysisResult?.recommendations} />}
              {activeTab === 'swotPorter'      && <SWOTPorter analysisResult={analysisResult} />}
              {activeTab === 'scenarios'       && <SWOTPorter analysisResult={{ scenarios: analysisResult?.scenarios }} />}
              {activeTab === 'forecast'        && <Forecasting forecast={dataProfile?.forecast} />}
              {activeTab === 'charts'          && <DataCharts dataProfile={dataProfile} analysisResult={analysisResult} />}
              {activeTab === 'methodology'     && <Methodology />}
              {activeTab === 'chat'            && <ChatInterface />}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
