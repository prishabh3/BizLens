import { useState, useEffect, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import AnalyzingScreen from './components/AnalyzingScreen';
import { encodeSharePayload, decodeSharePayload, buildShareUrl, extractShareFromUrl, clearShareFromUrl } from './lib/sharing';
import { AnalysisContext } from './context/AnalysisContext';
import { loadCachedSession } from './hooks/useSession';
import { useAnalysis } from './hooks/useAnalysis';
import { useDuckDB } from './hooks/useDuckDB';
import { useToast } from './context/ToastContext';

export default function App() {
  const { toast } = useToast();
  const { conn, ready: duckDBReady, error: duckDBError } = useDuckDB();
  const [stage, setStage] = useState('upload');
  const [parsedData, setParsedData] = useState(null);
  const [cachedSession, setCachedSession] = useState(null);

  const {
    analysisResult, setAnalysisResult,
    dataProfile, setDataProfile,
    sector, setSector,
    error,
    isLoading,
    streamingText,
    timings,
    hasLastArgs,
    runAnalysis,
    retry,
    reset,
  } = useAnalysis(conn);

  useEffect(() => {
    if (duckDBError) {
      toast('Failed to initialize DuckDB-WASM. Please use Chrome and ensure HTTPS or localhost.', 'error', 0);
    }
  }, [duckDBError, toast]);

  useEffect(() => {
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
  };

  const handleAnalyze = useCallback(async (selectedSector, data) => {
    setStage('analyzing');
    const res = await runAnalysis(selectedSector, data);
    if (res) {
      setStage('dashboard');
    } else {
      setStage('upload');
      toast('Analysis failed. Check your data and API key, then try again.', 'error');
    }
  }, [runAnalysis, toast]);

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

  return (
    <AnalysisContext.Provider value={contextValue}>
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
