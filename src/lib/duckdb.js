import * as duckdb from '@duckdb/duckdb-wasm';

let dbInstance = null;
let connInstance = null;

export async function initDuckDB() {
    if (dbInstance && connInstance) {
        return { db: dbInstance, conn: connInstance };
    }

    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select the best bundle for this browser
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(worker_url);

    const conn = await db.connect();

    dbInstance = db;
    connInstance = conn;

    return { db, conn };
}

export async function runQuery(conn, sql) {
    try {
        const result = await conn.query(sql);
        const rows = result.toArray().map((row) => row.toJSON());
        return rows;
    } catch (err) {
        console.error('DuckDB query error:', err);
        throw err;
    }
}
