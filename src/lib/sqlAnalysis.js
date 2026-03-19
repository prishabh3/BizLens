import { runQuery } from './duckdb';

const KPI_KEYWORDS = ['cost', 'revenue', 'rate', 'score', 'count', 'time', 'days', 'avg', 'total', 'pct', 'percent', 'ratio', 'amount', 'price', 'hours', 'salary'];
const TIME_KEYWORDS = ['date', 'time', 'month', 'year', 'week', 'day', 'period', 'quarter'];

function isNumericColumn(column, rows) {
    const values = rows.map((r) => r[column]).filter((v) => v !== null && v !== undefined && v !== '');
    if (values.length === 0) return false;
    return values.every((v) => typeof v === 'number' || !isNaN(Number(v)));
}

export async function loadDataset(conn, columns, rows) {
    // Drop existing table if any
    await conn.query('DROP TABLE IF EXISTS dataset');

    if (rows.length === 0) return;

    // Build CREATE TABLE with appropriate types
    const colDefs = columns.map((col) => {
        const sample = rows.find((r) => r[col] !== null && r[col] !== undefined)?.[col];
        let type = 'VARCHAR';
        if (typeof sample === 'number') type = 'DOUBLE';
        return `"${col}" ${type}`;
    });

    await conn.query(`CREATE TABLE dataset (${colDefs.join(', ')})`);

    // Insert rows in batches of 100
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
        await conn.query(`INSERT INTO dataset VALUES ${values.join(', ')}`);
    }
}

export async function runProfileQueries(conn, columns, rows) {
    const profile = {
        rowCount: 0,
        columnCount: columns.length,
        columns: {},
        kpiColumns: [],
        timeColumns: [],
        anomalies: [],
        sampleRows: rows.slice(0, 5),
    };

    // Row count
    const rcResult = await runQuery(conn, 'SELECT COUNT(*) as cnt FROM dataset');
    profile.rowCount = Number(rcResult[0]?.cnt ?? 0);

    const numericCols = columns.filter((c) => isNumericColumn(c, rows));
    const categoricalCols = columns.filter((c) => !isNumericColumn(c, rows));

    // Detect KPI and time columns
    profile.kpiColumns = numericCols.filter((c) =>
        KPI_KEYWORDS.some((kw) => c.toLowerCase().includes(kw))
    );
    profile.timeColumns = columns.filter((c) =>
        TIME_KEYWORDS.some((kw) => c.toLowerCase().includes(kw))
    );

    // Numeric stats per column
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

                // Anomaly detection: values > 2 stddev from mean
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

    // Categorical stats per column
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
            profile.columns[col] = {
                type: 'categorical',
                nullCount: Number(nullResult[0]?.null_count ?? 0),
                topValues: top5.map((r) => ({ value: r.val, count: Number(r.cnt) })),
            };
        } catch (e) {
            console.warn(`Skipping categorical stats for ${col}:`, e.message);
        }
    }

    return profile;
}
