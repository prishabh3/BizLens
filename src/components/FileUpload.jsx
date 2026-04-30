import { useState, useRef, useCallback } from 'react';

function sheetsUrlToCsv(url) {
  // https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return null;
  const gidMatch = url.match(/gid=(\d+)/);
  const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv${gid}`;
}

function isGoogleSheets(url) {
  return url.includes('docs.google.com/spreadsheets');
}

const SECTORS = [
  'Healthcare / SHaPE',
  'Technology, Media & Telecommunications',
  'Public & Social Sector',
  'Retail & Consumer Goods',
  'Financial Services',
  'General Business',
];

function FileDropZone({ label, parsed, onFiles, accept = '.csv,.xlsx,.xls,.txt' }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onFiles(e.dataTransfer.files);
  }, [onFiles]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={parsed ? `File loaded: ${parsed.rows.length} rows, ${parsed.columns.length} columns. Click to replace.` : label}
      className={`border text-center cursor-pointer transition-all p-8 bg-white
        ${dragging ? 'border-[#2251FF] bg-blue-50/30' : parsed ? 'border-emerald-400 bg-emerald-50/20' : 'border-gray-300 hover:border-gray-400'}
        focus:outline-none focus:ring-2 focus:ring-[#2251FF] focus:ring-offset-1`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" aria-hidden="true" onChange={(e) => onFiles(e.target.files)} />
      <div className="flex flex-col items-center gap-2">
        {parsed ? (
          <>
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-[13px] text-emerald-700 font-semibold">{parsed.rows.length} rows — {parsed.columns.length} columns</p>
            <p className="text-[11px] text-gray-400">Click to replace</p>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 text-[#2251FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-[13px] text-gray-700 font-medium">{label}</p>
            <p className="text-[11px] text-gray-400">CSV, Excel, TXT</p>
          </>
        )}
      </div>
    </div>
  );
}

function JoinConfig({ parsed1, parsed2, joinConfig, onChange }) {
  if (!parsed1 || !parsed2) return null;

  const cols1 = parsed1.columns;
  const cols2 = parsed2.columns;
  const common = cols1.filter((c) => cols2.includes(c));

  return (
    <div className="bg-[#F5F5F5] p-5 border-l-4 border-[#2251FF] space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-[#2251FF] uppercase tracking-widest">Join Configuration</span>
        {common.length > 0 && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 border border-emerald-200 font-bold">
            {common.length} common column{common.length > 1 ? 's' : ''} detected
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Join Type</label>
          <select
            value={joinConfig.type}
            onChange={(e) => onChange({ ...joinConfig, type: e.target.value })}
            className="w-full border border-gray-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#2251FF] rounded-none"
          >
            <option value="INNER">Inner Join</option>
            <option value="LEFT">Left Join</option>
            <option value="RIGHT">Right Join</option>
            <option value="FULL">Full Outer Join</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">File 1 Key</label>
          <select
            value={joinConfig.key1}
            onChange={(e) => onChange({ ...joinConfig, key1: e.target.value })}
            className="w-full border border-gray-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#2251FF] rounded-none"
          >
            <option value="">Select column…</option>
            {cols1.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">File 2 Key</label>
          <select
            value={joinConfig.key2}
            onChange={(e) => onChange({ ...joinConfig, key2: e.target.value })}
            className="w-full border border-gray-300 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#2251FF] rounded-none"
          >
            <option value="">Select column…</option>
            {cols2.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {joinConfig.key1 && joinConfig.key2 && (
        <p className="text-[11px] text-gray-500">
          Will join <strong>File 1</strong>.{joinConfig.key1} = <strong>File 2</strong>.{joinConfig.key2} using {joinConfig.type} JOIN → analysis runs on merged dataset
        </p>
      )}
    </div>
  );
}

export default function FileUpload({ onFileReady, onAnalyze, isLoading, duckDBReady, cachedSession, onRestoreSession }) {
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [parsed2, setParsed2] = useState(null);
  const [sector, setSector] = useState(SECTORS[0]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [loadingExample, setLoadingExample] = useState(false);
  const [showSecondFile, setShowSecondFile] = useState(false);
  const [joinConfig, setJoinConfig] = useState({ type: 'INNER', key1: '', key2: '' });
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const fileInputRef = useRef();

  const handleFiles = useCallback(async (files, isSecond = false) => {
    const file = files[0];
    if (!file) return;
    const { dispatchFile } = await import('../lib/fileParser');
    const result = await dispatchFile(file);
    if (isSecond) {
      setParsed2(result);
      // Auto-detect common key
      if (parsed) {
        const common = parsed.columns.filter((c) => result.columns.includes(c));
        if (common.length > 0) setJoinConfig((j) => ({ ...j, key1: common[0], key2: common[0] }));
      }
    } else {
      setParsed(result);
      onFileReady(result);
    }
  }, [onFileReady, parsed]);

  const handlePasteSubmit = async () => {
    const { parseText } = await import('../lib/fileParser');
    const result = parseText(pasteText);
    setParsed(result);
    onFileReady(result);
    setPasteMode(false);
  };

  const handleUrlImport = async () => {
    const raw = urlInput.trim();
    if (!raw) return;
    setUrlError('');
    setUrlLoading(true);
    try {
      const fetchUrl = isGoogleSheets(raw) ? sheetsUrlToCsv(raw) : raw;
      if (!fetchUrl) throw new Error('Could not parse Google Sheets URL.');
      const resp = await fetch(fetchUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} — make sure the sheet/file is publicly accessible.`);
      const text = await resp.text();
      const filename = isGoogleSheets(raw) ? 'sheets_import.csv' : raw.split('/').pop() || 'import.csv';
      const file = new File([text], filename, { type: 'text/csv' });
      await handleFiles([file], false);
      setUrlMode(false);
      setUrlInput('');
    } catch (e) {
      setUrlError(e.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleExampleDataset = async () => {
    setLoadingExample(true);
    try {
      const resp = await fetch('/sample_hospital.csv');
      const text = await resp.text();
      const file = new File([text], 'sample_hospital.csv', { type: 'text/csv' });
      await handleFiles([file]);
    } finally {
      setLoadingExample(false);
    }
  };

  const canAnalyze = parsed && (
    !showSecondFile ||
    !parsed2 ||
    (joinConfig.key1 && joinConfig.key2)
  );

  const handleAnalyzeClick = () => {
    if (!canAnalyze) return;
    const payload = { ...parsed };
    if (showSecondFile && parsed2 && joinConfig.key1 && joinConfig.key2) {
      payload.secondDataset = parsed2;
      payload.joinConfig = joinConfig;
    }
    onAnalyze(sector, payload);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans-body">
      <div className="h-1.5 w-full bg-[#2251FF]" />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
        <span className="font-serif-heading font-bold text-gray-900 text-xl tracking-tight">BizLens</span>
        <div className="flex gap-6 text-[13px] font-medium text-gray-600 uppercase tracking-widest hidden sm:flex">
          <button onClick={() => document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2251FF] transition-colors cursor-pointer">Insights</button>
          <button onClick={() => document.getElementById('industry-select')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2251FF] transition-colors cursor-pointer">Industries</button>
          <button onClick={() => document.getElementById('capabilities-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#2251FF] transition-colors cursor-pointer">Capabilities</button>
        </div>
      </nav>

      {/* Restore session banner */}
      {cachedSession && onRestoreSession && (
        <div className="bg-blue-50 border-b border-blue-200 px-8 py-3 flex items-center justify-between">
          <div>
            <span className="text-[13px] font-semibold text-blue-800">Previous session available: </span>
            <span className="text-[13px] text-blue-700">{cachedSession.sector} — {new Date(cachedSession.savedAt).toLocaleDateString()}</span>
          </div>
          <button
            onClick={onRestoreSession}
            className="text-[12px] font-bold text-[#2251FF] border border-[#2251FF] px-4 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Restore Session
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto">

        {/* Left hero */}
        <div className="w-full lg:w-5/12 p-8 lg:p-16 flex flex-col justify-center border-r border-gray-100 bg-[#F5F5F5]">
          <h1 className="font-serif-heading text-[2.75rem] leading-[1.1] text-gray-900 mb-6 font-bold">
            Accelerating <br /> data-driven <br /> strategic decisions.
          </h1>
          <div className="h-px w-16 bg-[#2251FF] mb-6" />
          <p className="text-[17px] text-gray-600 leading-relaxed font-light mb-8 max-w-md">
            Upload your operational or financial dataset. BizLens utilizes advanced analytics and AI to generate structured, professional insights tailored to your industry.
          </p>
          <div id="capabilities-section" className="space-y-2 text-[13px] text-gray-500">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Capabilities</p>
            {[
              'Streaming AI analysis',
              'DuckDB in-browser SQL engine',
              'Sector-specific benchmarks',
              'Multi-file join support',
              'Auto chart generation',
              'PDF slide deck export',
              'Natural language data chat',
              'Session persistence',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2251FF]" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right interaction */}
        <div className="w-full lg:w-7/12 p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-xl w-full mx-auto space-y-7">

            <h2 id="upload-zone" className="font-serif-heading text-2xl text-gray-900 font-bold">Data Ingestion</h2>

            {/* Primary upload */}
            {!pasteMode && !urlMode ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {showSecondFile ? 'File 1 (Primary Dataset)' : 'Dataset File'}
                </label>
                <FileDropZone
                  label="Drop dataset here or browse"
                  parsed={parsed}
                  onFiles={(files) => handleFiles(files, false)}
                />
              </div>
            ) : urlMode ? (
              <div className="border border-gray-300 p-6 bg-white space-y-3">
                <p className="text-[14px] text-gray-900 font-semibold">Import from URL</p>
                <p className="text-[12px] text-gray-500">Paste a Google Sheets link (must be publicly viewable) or any public CSV URL.</p>
                <input
                  type="url"
                  className="w-full border border-gray-300 px-4 py-3 text-[13px] focus:outline-none focus:border-[#2251FF] font-mono"
                  placeholder="https://docs.google.com/spreadsheets/d/... or https://example.com/data.csv"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                />
                {urlError && <p className="text-[12px] text-red-600 font-medium">{urlError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleUrlImport}
                    disabled={urlLoading || !urlInput.trim()}
                    className="px-6 py-2.5 bg-[#2251FF] text-white text-[13px] font-bold hover:bg-[#002D72] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {urlLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {urlLoading ? 'Fetching…' : 'Import'}
                  </button>
                  <button onClick={() => { setUrlMode(false); setUrlError(''); }} className="px-6 py-2.5 border border-gray-300 text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 p-6 bg-white space-y-4">
                <p className="text-[15px] text-gray-900 font-medium">Paste Delimited Text</p>
                <textarea
                  className="w-full h-40 border border-gray-300 p-4 text-[13px] font-mono resize-none focus:outline-none focus:border-[#2251FF]"
                  placeholder="col1,col2&#10;val1,val2"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={handlePasteSubmit} className="px-6 py-2.5 bg-[#2251FF] text-white text-[13px] font-bold tracking-wide hover:bg-[#002D72] transition-colors">PARSE DATA</button>
                  <button onClick={() => setPasteMode(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 text-[13px] font-bold hover:bg-gray-50 transition-colors">CANCEL</button>
                </div>
              </div>
            )}

            {/* Second file */}
            {showSecondFile && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">File 2 (Secondary Dataset)</label>
                  <button onClick={() => { setShowSecondFile(false); setParsed2(null); }} className="text-[11px] text-red-400 hover:text-red-600 font-medium">Remove</button>
                </div>
                <FileDropZone
                  label="Drop second dataset here"
                  parsed={parsed2}
                  onFiles={(files) => handleFiles(files, true)}
                />
              </div>
            )}

            {/* Join config */}
            {showSecondFile && (
              <JoinConfig
                parsed1={parsed}
                parsed2={parsed2}
                joinConfig={joinConfig}
                onChange={setJoinConfig}
              />
            )}

            {/* Secondary actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleExampleDataset}
                disabled={loadingExample}
                className="text-[13px] text-[#2251FF] font-medium hover:underline flex items-center gap-2"
              >
                {loadingExample
                  ? <span className="w-3 h-3 border border-[#2251FF] border-t-transparent rounded-full animate-spin" />
                  : 'Load sample dataset'
                }
              </button>
              {!pasteMode && !urlMode && (
                <button onClick={() => setUrlMode(true)} className="text-[13px] text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Import from URL / Google Sheets
                </button>
              )}
              {!pasteMode && !urlMode && (
                <button onClick={() => setPasteMode(true)} className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">
                  Paste text manually
                </button>
              )}
              {!showSecondFile && parsed && (
                <button onClick={() => setShowSecondFile(true)} className="text-[13px] text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add second file (join)
                </button>
              )}
            </div>

            {/* Data preview */}
            {parsed && parsed.rows.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif-heading text-base text-gray-900 font-bold">
                    {showSecondFile && parsed2 ? 'File 1 Preview' : 'Data Preview'}
                  </h3>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                    {parsed.rows.length.toLocaleString()} rows
                  </span>
                </div>
                <div className="overflow-x-auto border border-gray-200">
                  <table className="min-w-full text-left text-[11px]">
                    <thead className="bg-[#F5F5F5] border-b border-gray-200">
                      <tr>
                        {parsed.columns.slice(0, 6).map((col) => (
                          <th key={col} className="px-3 py-2 font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                        {parsed.columns.length > 6 && <th className="px-3 py-2 text-gray-400">+{parsed.columns.length - 6} more</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsed.rows.slice(0, 4).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {parsed.columns.slice(0, 6).map((col) => (
                            <td key={col} className="px-3 py-1.5 text-gray-600 whitespace-nowrap max-w-[130px] truncate">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                            </td>
                          ))}
                          {parsed.columns.length > 6 && <td className="px-3 py-1.5 text-gray-300">…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analysis config */}
            {parsed && (
              <div id="industry-select" className="bg-[#F5F5F5] p-7 border-l-4 border-[#2251FF]">
                <h3 className="font-serif-heading text-base text-gray-900 font-bold mb-4">Configure Analysis</h3>
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Industry Focus</label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full border border-gray-300 bg-white px-4 py-3 text-[14px] text-gray-900 focus:outline-none focus:border-[#2251FF] rounded-none shadow-sm"
                    >
                      {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading || !duckDBReady || !canAnalyze}
                    className="w-full sm:w-auto px-8 py-3 bg-[#2251FF] text-white text-[13px] font-bold tracking-wider uppercase hover:bg-[#002D72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[200px]"
                  >
                    {isLoading ? 'Processing…' : !duckDBReady ? 'Engine Init…' : 'Generate Insights'}
                  </button>
                </div>
                {showSecondFile && parsed2 && (!joinConfig.key1 || !joinConfig.key2) && (
                  <p className="text-[11px] text-amber-600 mt-3 font-medium">Select join keys above to analyze merged dataset, or remove File 2 to analyze File 1 only.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
