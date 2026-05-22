import { useState, useCallback } from 'react';
import { loadDataset, runProfileQueries } from '../lib/sqlAnalysis';
import { analyzeWithClaude } from '../lib/claude';
import { saveSession } from './useSession';

export function useAnalysis(conn) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dataProfile, setDataProfile] = useState(null);
  const [sector, setSector] = useState('General Business');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [timings, setTimings] = useState(null);
  const [lastArgs, setLastArgs] = useState(null);

  const runAnalysis = useCallback(async (selectedSector, data) => {
    if (!conn) return;

    setSector(selectedSector);
    setError(null);
    setIsLoading(true);
    setStreamingText('');
    setAnalysisResult(null);
    setTimings(null);
    setLastArgs({ selectedSector, data });

    const t0 = performance.now();

    try {
      const hasJoin = !!(data.secondDataset && data.joinConfig?.key1 && data.joinConfig?.key2);
      await loadDataset(conn, data.columns, data.rows, hasJoin ? 'dataset1' : 'dataset');

      let profileColumns = data.columns;
      let profileRows = data.rows;

      if (hasJoin) {
        const { secondDataset, joinConfig } = data;
        await loadDataset(conn, secondDataset.columns, secondDataset.rows, 'dataset2');

        const collidingCols = secondDataset.columns.filter(
          (c) => c !== joinConfig.key2 && data.columns.includes(c)
        );
        const d2Cols = secondDataset.columns
          .filter((c) => c !== joinConfig.key2)
          .map((c) => `d2."${c}" AS "${collidingCols.includes(c) ? `${c}_2` : c}"`)
          .join(', ');

        await conn.query('DROP VIEW IF EXISTS dataset');
        await conn.query(`
          CREATE VIEW dataset AS
          SELECT d1.*, ${d2Cols}
          FROM dataset1 AS d1
          ${joinConfig.type} JOIN dataset2 AS d2
            ON d1."${joinConfig.key1}" = d2."${joinConfig.key2}"
        `);

        const { runQuery } = await import('../lib/duckdb');
        const joinedRows = await runQuery(conn, 'SELECT * FROM dataset LIMIT 200');
        profileColumns = joinedRows.length > 0 ? Object.keys(joinedRows[0]) : profileColumns;
        profileRows = joinedRows;
      }

      const t1 = performance.now();
      const profile = await runProfileQueries(conn, profileColumns, profileRows);
      const t2 = performance.now();
      setDataProfile(profile);

      let firstTokenTime = null;
      const result = await analyzeWithClaude(
        selectedSector,
        profile,
        profileColumns,
        profileRows.slice(0, 5),
        (partial) => {
          if (partial) setAnalysisResult(partial);
          if (firstTokenTime === null) firstTokenTime = performance.now();
          setStreamingText((t) => t + '.');
        }
      );

      const t3 = performance.now();
      setAnalysisResult(result);
      setStreamingText('');
      setTimings({
        profileMs: Math.round(t2 - t1),
        firstTokenMs: firstTokenTime ? Math.round(firstTokenTime - t2) : null,
        totalMs: Math.round(t3 - t0),
      });

      saveSession({ analysisResult: result, dataProfile: profile, sector: selectedSector, columns: profileColumns });

      return { result, profile };
    } catch (e) {
      console.error('Analysis error:', e);
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  }, [conn]);

  const retry = useCallback(() => {
    if (!lastArgs) return;
    setError(null);
    runAnalysis(lastArgs.selectedSector, lastArgs.data);
  }, [lastArgs, runAnalysis]);

  const reset = useCallback(() => {
    setAnalysisResult(null);
    setDataProfile(null);
    setError(null);
    setStreamingText('');
    setTimings(null);
    setLastArgs(null);
  }, []);

  return {
    analysisResult, setAnalysisResult,
    dataProfile, setDataProfile,
    sector, setSector,
    error, setError,
    isLoading,
    streamingText,
    timings,
    hasLastArgs: !!lastArgs,
    runAnalysis,
    retry,
    reset,
  };
}
