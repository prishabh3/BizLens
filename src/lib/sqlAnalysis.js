import { runQuery } from './duckdb';

const KPI_KEYWORDS = ['cost', 'revenue', 'rate', 'score', 'count', 'time', 'days', 'avg', 'total', 'pct', 'percent', 'ratio', 'amount', 'price', 'hours', 'salary', 'spend', 'budget', 'margin', 'profit', 'loss', 'income', 'expense', 'volume', 'quantity', 'units', 'value'];
const TIME_KEYWORDS = ['date', 'time', 'month', 'year', 'week', 'day', 'period', 'quarter', 'timestamp', 'created', 'updated', 'at', 'on'];

// Common date patterns
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,  // ISO 8601
  /^\d{2}\/\d{2}\/\d{4}$/,                       // MM/DD/YYYY
  /^\d{2}-\d{2}-\d{4}$/,                         // MM-DD-YYYY
  /^\d{4}\/\d{2}\/\d{2}$/,                       // YYYY/MM/DD
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i,
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i,
  /^\d{4}Q[1-4]$/,                               // 2023Q1
  /^\d{4}-(0[1-9]|1[0-2])$/,                     // 2023-01 (year-month)
];

function isNumericColumn(column, rows) {
  const values = rows.map((r) => r[column]).filter((v) => v !== null && v !== undefined && v !== '');
  if (values.length === 0) return false;
  return values.every((v) => typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== ''));
}

function isDateColumn(column, rows) {
  const values = rows
    .map((r) => r[column])
    .filter((v) => v !== null && v !== undefined && v !== '' && typeof v === 'string')
    .slice(0, 20);

  if (values.length === 0) return false;

  const matchCount = values.filter((v) =>
    DATE_PATTERNS.some((pattern) => pattern.test(String(v).trim()))
  ).length;

  return matchCount / values.length >= 0.8;
}

export async function loadDataset(conn, columns, rows, tableName = 'dataset') {
  await conn.query(`DROP VIEW IF EXISTS ${tableName}`);
  await conn.query(`DROP TABLE IF EXISTS ${tableName}`);

  if (rows.length === 0) return;

  const colDefs = columns.map((col) => {
    const sample = rows.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
    let type = 'VARCHAR';
    if (typeof sample === 'number') type = 'DOUBLE';
    else if (isDateColumn(col, rows)) type = 'VARCHAR'; // keep as VARCHAR, cast in queries
    return `"${col}" ${type}`;
  });

  await conn.query(`CREATE TABLE ${tableName} (${colDefs.join(', ')})`);

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch.map((row) => {
      const vals = columns.map((col) => {
        const v = row[col];
        if (v === null || v === undefined || v === '') return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    });
    await conn.query(`INSERT INTO ${tableName} VALUES ${values.join(', ')}`);
  }
}

export async function runProfileQueries(conn, columns, rows) {
  const profile = {
    rowCount: 0,
    columnCount: columns.length,
    columns: {},
    kpiColumns: [],
    timeColumns: [],
    dateColumns: [],
    anomalies: [],
    sampleRows: rows.slice(0, 5),
  };

  const rcResult = await runQuery(conn, 'SELECT COUNT(*) as cnt FROM dataset');
  profile.rowCount = Number(rcResult[0]?.cnt ?? 0);

  const numericCols = columns.filter((c) => isNumericColumn(c, rows));
  const dateCols = columns.filter((c) => !isNumericColumn(c, rows) && isDateColumn(c, rows));
  const categoricalCols = columns.filter((c) => !isNumericColumn(c, rows) && !isDateColumn(c, rows));

  profile.kpiColumns = numericCols.filter((c) =>
    KPI_KEYWORDS.some((kw) => c.toLowerCase().includes(kw))
  );
  profile.timeColumns = columns.filter((c) =>
    TIME_KEYWORDS.some((kw) => c.toLowerCase().includes(kw))
  );
  profile.dateColumns = dateCols;

  // Numeric stats
  for (const col of numericCols) {
    try {
      const safeCol = `"${col}"`;
      const statsSQL = `
        SELECT
          COUNT(${safeCol}) as non_null_count,
          COUNT(*) - COUNT(${safeCol}) as null_count,
          MIN(${safeCol}) as min_val,
          MAX(${safeCol}) as max_val,
          AVG(${safeCol}) as avg_val,
          STDDEV(${safeCol}) as stddev_val,
          PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${safeCol}) as p25,
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${safeCol}) as p75
        FROM dataset
        WHERE ${safeCol} IS NOT NULL
      `;
      const stats = await runQuery(conn, statsSQL);
      if (stats.length > 0) {
        const s = stats[0];
        profile.columns[col] = {
          type: 'numeric',
          nonNullCount: Number(s.non_null_count),
          nullCount: Number(s.null_count),
          min: Number(s.min_val),
          max: Number(s.max_val),
          avg: Number(s.avg_val),
          stddev: Number(s.stddev_val),
          p25: Number(s.p25),
          p75: Number(s.p75),
        };

        if (s.stddev_val > 0) {
          const mean = Number(s.avg_val);
          const std = Number(s.stddev_val);
          const anomalySQL = `
            SELECT ${safeCol} as val, COUNT(*) as cnt
            FROM dataset
            WHERE ABS(${safeCol} - ${mean}) > ${2 * std}
            GROUP BY ${safeCol}
            LIMIT 5
          `;
          const anomalyRows = await runQuery(conn, anomalySQL);
          if (anomalyRows.length > 0) {
            profile.anomalies.push({
              column: col,
              mean: mean.toFixed(2),
              stddev: std.toFixed(2),
              outliers: anomalyRows.map((r) => ({
                value: Number(r.val).toFixed(2),
                count: Number(r.cnt),
              })),
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Skipping numeric stats for ${col}:`, e.message);
    }
  }

  // Date column stats
  for (const col of dateCols) {
    try {
      const safeCol = `"${col}"`;
      const dateStatsSQL = `
        SELECT
          COUNT(${safeCol}) as non_null_count,
          MIN(${safeCol}) as min_date,
          MAX(${safeCol}) as max_date,
          COUNT(DISTINCT ${safeCol}) as distinct_count
        FROM dataset
        WHERE ${safeCol} IS NOT NULL
      `;
      const stats = await runQuery(conn, dateStatsSQL);
      if (stats.length > 0) {
        profile.columns[col] = {
          type: 'date',
          nonNullCount: Number(stats[0].non_null_count),
          minDate: stats[0].min_date,
          maxDate: stats[0].max_date,
          distinctCount: Number(stats[0].distinct_count),
        };
      }
    } catch (e) {
      console.warn(`Skipping date stats for ${col}:`, e.message);
    }
  }

  // Categorical stats
  for (const col of categoricalCols) {
    try {
      const safeCol = `"${col}"`;
      const nullSQL = `SELECT COUNT(*) - COUNT(${safeCol}) as null_count FROM dataset`;
      const nullResult = await runQuery(conn, nullSQL);
      const top5SQL = `
        SELECT ${safeCol} as val, COUNT(*) as cnt
        FROM dataset
        WHERE ${safeCol} IS NOT NULL
        GROUP BY ${safeCol}
        ORDER BY cnt DESC
        LIMIT 5
      `;
      const top5 = await runQuery(conn, top5SQL);
      const distinctSQL = `SELECT COUNT(DISTINCT ${safeCol}) as cnt FROM dataset`;
      const distinctResult = await runQuery(conn, distinctSQL);
      profile.columns[col] = {
        type: 'categorical',
        nullCount: Number(nullResult[0]?.null_count ?? 0),
        distinctCount: Number(distinctResult[0]?.cnt ?? 0),
        topValues: top5.map((r) => ({ value: r.val, count: Number(r.cnt) })),
      };
    } catch (e) {
      console.warn(`Skipping categorical stats for ${col}:`, e.message);
    }
  }

  // Time-series aggregations + linear regression forecast
  if (dateCols.length > 0 && profile.kpiColumns.length > 0) {
    const dateCol = dateCols[0];
    const kpiCol = profile.kpiColumns[0];
    try {
      const tsSQL = `
        SELECT "${dateCol}" as period, AVG("${kpiCol}") as avg_value, COUNT(*) as count
        FROM dataset
        WHERE "${dateCol}" IS NOT NULL AND "${kpiCol}" IS NOT NULL
        GROUP BY "${dateCol}"
        ORDER BY "${dateCol}"
        LIMIT 50
      `;
      const tsRows = await runQuery(conn, tsSQL);
      if (tsRows.length > 2) {
        const tsData = tsRows.map((r) => ({
          period: String(r.period),
          value: Number(r.avg_value),
          count: Number(r.count),
        }));
        profile.timeSeries = { dateColumn: dateCol, valueColumn: kpiCol, data: tsData };

        // Linear regression using DuckDB's built-in regr_ functions
        try {
          const regrSQL = `
            WITH numbered AS (
              SELECT AVG("${kpiCol}") as val, ROW_NUMBER() OVER (ORDER BY "${dateCol}") as rn
              FROM dataset
              WHERE "${dateCol}" IS NOT NULL AND "${kpiCol}" IS NOT NULL
              GROUP BY "${dateCol}"
              ORDER BY "${dateCol}"
            )
            SELECT
              regr_slope(val, rn)      AS slope,
              regr_intercept(val, rn)  AS intercept,
              regr_r2(val, rn)         AS r_squared,
              COUNT(*)                 AS n
            FROM numbered
          `;
          const regrRows = await runQuery(conn, regrSQL);
          if (regrRows.length > 0 && regrRows[0].slope !== null) {
            const slope = Number(regrRows[0].slope);
            const intercept = Number(regrRows[0].intercept);
            const r2 = Number(regrRows[0].r_squared);
            const n = Number(regrRows[0].n);

            // Build fitted + forecast points (forecast 20% more periods)
            const forecastPeriods = Math.max(3, Math.round(n * 0.2));
            const fittedAndForecast = [];

            tsData.forEach((d, i) => {
              fittedAndForecast.push({
                period: d.period,
                actual: d.value,
                trend: Number((slope * (i + 1) + intercept).toFixed(2)),
                forecast: null,
              });
            });

            // Append forecast-only points using period labels like "F+1", "F+2"...
            for (let f = 1; f <= forecastPeriods; f++) {
              fittedAndForecast.push({
                period: `F+${f}`,
                actual: null,
                trend: null,
                forecast: Number((slope * (n + f) + intercept).toFixed(2)),
              });
            }

            profile.forecast = {
              dateColumn: dateCol,
              valueColumn: kpiCol,
              slope: Number(slope.toFixed(4)),
              intercept: Number(intercept.toFixed(4)),
              r2: Number(r2.toFixed(4)),
              trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'flat',
              data: fittedAndForecast,
            };
          }
        } catch (e) {
          console.warn('Forecast regression failed:', e.message);
        }
      }
    } catch (e) {
      console.warn('Time series aggregation failed:', e.message);
    }
  }

  return profile;
}
