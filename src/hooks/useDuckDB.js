import { useState, useEffect } from 'react';
import { initDuckDB } from '../lib/duckdb';

export function useDuckDB() {
  const [conn, setConn] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    initDuckDB()
      .then(({ conn: c }) => {
        if (!cancelled) { setConn(c); setReady(true); }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'DuckDB failed to initialize');
      });
    return () => { cancelled = true; };
  }, []);

  return { conn, ready, error };
}
