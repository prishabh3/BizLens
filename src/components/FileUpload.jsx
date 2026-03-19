import { useState, useRef, useCallback } from 'react';

const SECTORS = [
    'Healthcare / SHaPE',
    'Technology, Media & Telecommunications',
    'Public & Social Sector',
    'Retail & Consumer Goods',
    'Financial Services',
];

export default function FileUpload({ onFileReady, onAnalyze, isLoading, duckDBReady }) {
    const [dragging, setDragging] = useState(false);
    const [parsed, setParsed] = useState(null);
    const [sector, setSector] = useState(SECTORS[0]);
    const [pasteMode, setPasteMode] = useState(false);
    const [pasteText, setPasteText] = useState('');
    const [loadingExample, setLoadingExample] = useState(false);
    const fileInputRef = useRef();

    const handleFiles = useCallback(async (files) => {
        const file = files[0];
        if (!file) return;
        const { dispatchFile } = await import('../lib/fileParser');
        const result = await dispatchFile(file);
        setParsed(result);
        onFileReady(result);
    }, [onFileReady]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const handlePasteSubmit = async () => {
        const { parseText } = await import('../lib/fileParser');
        const result = parseText(pasteText);
        setParsed(result);
        onFileReady(result);
        setPasteMode(false);
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

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans-body">

            {/* McKinsey-style Top Border */}
            <div className="h-1.5 w-full bg-[#2251FF]"></div>

            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="font-serif-heading font-bold text-gray-900 text-xl tracking-tight">BizLens</span>
                </div>
                <div className="flex gap-6 text-[13px] font-medium text-gray-600 uppercase tracking-widest hidden sm:flex">
                    <span>Insights</span>
                    <span>Industries</span>
                    <span>Capabilities</span>
                </div>
            </nav>

            {/* Content */}
            <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1400px] mx-auto">

                {/* Left Column: Typography/Hero */}
                <div className="w-full lg:w-5/12 p-8 lg:p-16 flex flex-col justify-center border-r border-gray-100 bg-[#F5F5F5]">
                    <h1 className="font-serif-heading text-[2.75rem] leading-[1.1] text-gray-900 mb-6 font-bold">
                        Accelerating <br /> data-driven <br /> strategic decisions.
                    </h1>
                    <div className="h-px w-16 bg-[#2251FF] mb-6"></div>
                    <p className="text-[17px] text-gray-600 leading-relaxed font-light mb-8 max-w-md">
                        Upload your operational or financial dataset. BizLens utilizes advanced analytics and AI to generate structured, professional insights tailored to your industry.
                    </p>
                </div>

                {/* Right Column: Interaction */}
                <div className="w-full lg:w-7/12 p-8 lg:p-16 flex flex-col justify-center bg-white border-l border-gray-100 -ml-px">
                    <div className="max-w-xl w-full mx-auto space-y-8">

                        <h2 className="font-serif-heading text-2xl text-gray-900 font-bold">Data Ingestion</h2>

                        {/* Upload Area */}
                        {!pasteMode ? (
                            <div
                                className={`border text-center cursor-pointer transition-all p-12 bg-white
                  ${dragging
                                        ? 'border-[#2251FF] bg-blue-50/30'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.txt"
                                    className="hidden"
                                    onChange={(e) => handleFiles(e.target.files)}
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <svg className="w-8 h-8 text-[#2251FF] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <div>
                                        <p className="text-[15px] text-gray-900">
                                            {dragging ? 'Drop file here' : 'Drop dataset here or browse'}
                                        </p>
                                        <p className="text-[13px] text-gray-500 mt-1">
                                            Supported formats: CSV, Excel, TXT
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-300 p-6 bg-white space-y-4">
                                <p className="text-[15px] text-gray-900 font-medium">Paste Delimited Text</p>
                                <textarea
                                    className="w-full h-48 border border-gray-300 p-4 text-[13px] font-mono resize-none focus:outline-none focus:border-[#2251FF]"
                                    placeholder="col1,col2&#10;val1,val2"
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button onClick={handlePasteSubmit} className="px-6 py-3 bg-[#2251FF] text-white text-[13px] font-bold tracking-wide hover:bg-[#002D72] transition-colors">PARSE DATA</button>
                                    <button onClick={() => setPasteMode(false)} className="px-6 py-3 border border-gray-300 text-gray-700 text-[13px] font-bold tracking-wide hover:bg-gray-50 transition-colors">CANCEL</button>
                                </div>
                            </div>
                        )}

                        {/* Secondary actions */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleExampleDataset}
                                disabled={loadingExample}
                                className="text-[13px] text-[#2251FF] font-medium hover:underline flex items-center gap-2"
                            >
                                {loadingExample
                                    ? <span className="w-3.5 h-3.5 border border-[#2251FF] border-t-transparent rounded-full animate-spin" />
                                    : <span>Load sample dataset</span>
                                }
                            </button>
                            <button onClick={() => setPasteMode(true)} className="text-[13px] text-gray-500 hover:text-gray-900 font-medium">
                                Enter text manually
                            </button>
                        </div>

                        {/* Data Preview */}
                        {parsed && parsed.rows.length > 0 && (
                            <div className="mt-8 border-t border-gray-200 pt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-serif-heading text-lg text-gray-900 font-bold">Data Summary</h3>
                                    <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-3 py-1 border border-emerald-200">
                                        {parsed.rows.length} rows verified
                                    </span>
                                </div>
                                <div className="overflow-x-auto border border-gray-200">
                                    <table className="min-w-full text-left text-[12px]">
                                        <thead className="bg-[#F5F5F5] border-b border-gray-200">
                                            <tr>
                                                {parsed.columns.map((col) => (
                                                    <th key={col} className="px-4 py-3 font-bold text-gray-700 uppercase tracking-wider">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parsed.rows.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    {parsed.columns.map((col) => (
                                                        <td key={col} className="px-4 py-2 text-gray-600 whitespace-nowrap max-w-[150px] truncate">
                                                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Analysis Configuration */}
                        {parsed && (
                            <div className="bg-[#F5F5F5] p-8 mt-8 border-l-4 border-[#2251FF]">
                                <h3 className="font-serif-heading text-lg text-gray-900 font-bold mb-4">Configure Analysis</h3>
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
                                        onClick={() => onAnalyze(sector)}
                                        disabled={isLoading || !duckDBReady}
                                        className="w-full sm:w-auto px-8 py-3 bg-[#2251FF] text-white text-[13px] font-bold tracking-wider uppercase hover:bg-[#002D72] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[200px]"
                                    >
                                        {isLoading ? 'Processing...' : !duckDBReady ? 'Engine Init...' : 'Generate Insights'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
