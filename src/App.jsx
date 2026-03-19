import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { initDuckDB } from './lib/duckdb';
import { loadDataset, runProfileQueries } from './lib/sqlAnalysis';
import { analyzeWithClaude } from './lib/claude';

export default function App() {
  const [stage, setStage] = useState('upload'); // 'upload' | 'analyzing' | 'dashboard'
  const [duckDBReady, setDuckDBReady] = useState(false);
  const [conn, setConn] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [dataProfile, setDataProfile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [sector, setSector] = useState('General Business');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize DuckDB on mount
  useEffect(() => {
    initDuckDB()
      .then(({ conn: c }) => {
        setConn(c);
        setDuckDBReady(true);
      })
      .catch((e) => {
        console.error('DuckDB init failed:', e);
        setError('Failed to initialize DuckDB-WASM. Please use Chrome and ensure HTTPS or localhost.');
      });
  }, []);

  const handleFileReady = (data) => {
    setParsedData(data);
    setAnalysisResult(null);
    setDataProfile(null);
    setError(null);
  };

  const handleAnalyze = async (selectedSector) => {
    if (!parsedData || !conn) return;
    setSector(selectedSector);
    setError(null);
    setIsLoading(true);
    setStage('analyzing');
    setAnalysisResult(null);

    try {
      // Step 1: Load data into DuckDB
      await loadDataset(conn, parsedData.columns, parsedData.rows);

      // Step 2: Run SQL profiling
      const profile = await runProfileQueries(conn, parsedData.columns, parsedData.rows);
      setDataProfile(profile);

      // Step 3: Show dashboard skeleton while Claude runs
      setStage('dashboard');

      // Step 4: Claude analysis
      const result = await analyzeWithClaude(selectedSector, profile, parsedData.columns, parsedData.rows.slice(0, 5));
      setAnalysisResult(result);
    } catch (e) {
      console.error('Analysis error:', e);
      setError(e.message);
      setStage('upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setStage('upload');
    setParsedData(null);
    setDataProfile(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-5 py-3 shadow-lg max-w-xl w-[90%] flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">Analysis Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {(stage === 'upload' || stage === 'analyzing') && stage !== 'dashboard' ? (
        <FileUpload
          onFileReady={handleFileReady}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          duckDBReady={duckDBReady}
        />
      ) : (
        <Dashboard
          analysisResult={analysisResult}
          dataProfile={dataProfile}
          sector={sector}
          conn={conn}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
    </>
  );
}
