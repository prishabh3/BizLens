import { useState, useEffect, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import AnalyzingScreen from './components/AnalyzingScreen';
import { initDuckDB } from './lib/duckdb';
import { encodeSharePayload, decodeSharePayload, buildShareUrl, extractShareFromUrl, clearShareFromUrl } from './lib/sharing';
import { AnalysisContext } from './context/AnalysisContext';
import { loadCachedSession } from './hooks/useSession';
import { useAnalysis } from './hooks/useAnalysis';

export default function App() {
  const [stage, setStage] = useState('upload');
  const [duckDBReady, setDuckDBReady] = useState(false);
  const [conn, setConn] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [cachedSession, setCachedSession] = useState(null);
  const [initError, setInitError] = useState(null);

  const {
    analysisResult, setAnalysisResult,
    dataProfile, setDataProfile,
    sector, setSector,
    error, setError,
    isLoading,
    streamingText,
    timings,
    hasLastArgs,
    runAnalysis,
    retry,
    reset,
  } = useAnalysis(conn);

  useEffect(() => {
    initDuckDB()
      .then(({ conn: c }) => {
        setConn(c);
        setDuckDBReady(true);
      })
      .catch((e) => {
        console.error('DuckDB init failed:', e);
        setInitError('Failed to initialize DuckDB-WASM. Please use Chrome and ensure HTTPS or localhost.');
      });

    const shareEncoded = extractShareFromUrl();
    if (shareEncoded) {
      const shared = decodeSharePayload(shareEncoded);
      if (shared?.analysisResult && shared?.sector) {
        clearShareFromUrl();
        setAnalysisResult(shared.analysisResult);
        setDataProfile(shared.profileSummary || null);
        setSector(shared.sector);
        setStage('dashboard');
        return;
      }
    }

    const cached = loadCachedSession();
    if (cached?.analysisResult && cached?.sector) {
      setCachedSession(cached);
    }
  }, []);

  const handleFileReady = (data) => {
    setParsedData(data);
    setError(null);
  };

  const handleAnalyze = useCallback(async (selectedSector, data) => {
    setStage('analyzing');
    const res = await runAnalysis(selectedSector, data);
    if (res) {
      setStage('dashboard');
    } else {
      setStage('upload');
    }
  }, [runAnalysis]);

  const handleRetry = useCallback(() => {
    retry();
  }, [retry]);

  const handleShare = useCallback(() => {
    if (!analysisResult) return null;
    const encoded = encodeSharePayload(analysisResult, dataProfile, sector);
    if (!encoded) return null;
    return buildShareUrl(encoded);
  }, [analysisResult, dataProfile, sector]);

  const handleNewAnalysis = () => {
    setStage('upload');
    setParsedData(null);
    reset();
  };

  const handleRestoreSession = () => {
    if (!cachedSession) return;
    setAnalysisResult(cachedSession.analysisResult);
    setDataProfile(cachedSession.dataProfile);
    setSector(cachedSession.sector);
    setStage('dashboard');
    setCachedSession(null);
  };

  const contextValue = { conn, analysisResult, dataProfile, sector, timings };

  const visibleError = initError || (stage === 'upload' && error);

  return (
    <AnalysisContext.Provider value={contextValue}>
      {visibleError && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-5 py-3 shadow-lg max-w-xl w-[90%] flex items-start gap-3"
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm">{initError ? 'Initialization Error' : 'Analysis Failed'}</p>
            <p className="text-xs mt-0.5">{visibleError}</p>
          </div>
          <button
            onClick={() => { setInitError(null); setError(null); }}
            aria-label="Dismiss error"
            className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {stage === 'upload' && (
        <FileUpload
          onFileReady={handleFileReady}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          duckDBReady={duckDBReady}
          cachedSession={cachedSession}
          onRestoreSession={handleRestoreSession}
        />
      )}

      {stage === 'analyzing' && (
        <AnalyzingScreen streamingText={streamingText} />
      )}

      {stage === 'dashboard' && (
        <Dashboard
          onNewAnalysis={handleNewAnalysis}
          streamingText={streamingText}
          onRetry={hasLastArgs ? handleRetry : null}
          lastError={error}
          onShare={handleShare}
        />
      )}
    </AnalysisContext.Provider>
  );
}
