# BizLens

BizLens turns a CSV or Excel file into a structured strategic analysis — issue tree, KPI benchmarks, SWOT, Porter's Five Forces, SCR-format recommendations, and a forecast — inside the browser, in under a minute. Nothing is uploaded to a server: DuckDB runs as a WebAssembly module in the tab, and only statistical summaries (never raw rows) are sent to Claude.

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| UI framework | React | 19.2 | Component rendering, state management |
| Build tool | Vite | 8.0 | Dev server, proxy, bundling |
| Styling | Tailwind CSS | 4.2 | Utility-class layout and theme |
| Analytics engine | DuckDB-WASM | 1.33.1-dev | In-browser SQL: profiling, aggregation, regression |
| Arrow bridge | Apache Arrow | 21.1 | DuckDB result serialization |
| AI model | Claude Sonnet 4.6 | — | Streaming JSON analysis + data chat |
| CSV parsing | PapaParse | 5.5 | CSV and tab-delimited text ingestion |
| Excel parsing | SheetJS / xlsx | 0.18 | `.xlsx`/`.xls` multi-sheet parsing and Excel export |
| Charts | Recharts | 3.8 | Bar, line, and forecast charts |
| PDF generation | jsPDF | 4.2 | In-browser 4-page PDF deck |
| Testing | Vitest | 3.2 | Unit tests (jsdom environment) |
| Type checking | TypeScript | 6.0 | Types for `sharing.ts` and `benchmarks.ts` |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser Tab                          │
│                                                          │
│  File / URL / Paste                                      │
│       │                                                  │
│       ▼                                                  │
│  PapaParse / SheetJS  ──────────────────────────────┐   │
│  (columns[], rows[])                                │   │
│                                                     ▼   │
│  DuckDB-WASM Worker                         React State  │
│  ┌─────────────────────────────┐                 │      │
│  │ CREATE TABLE dataset        │    analysisResult│      │
│  │ INSERT (100-row batches)    │    dataProfile   │      │
│  │ SELECT stats, percentiles,  │    sector        │      │
│  │   anomalies, time-series,   │─────────────────▶│      │
│  │   regr_slope / intercept    │                 │      │
│  └─────────────────────────────┘                 ▼      │
│                                           Dashboard UI   │
│  Statistical profile (JSON)                      │      │
│       │                                          │      │
│       ▼                                          │      │
│  Vite Dev Proxy (/api/claude)             Recharts charts│
│       │                                  Issue tree      │
│       ▼                                  KPI cards       │
│  Anthropic API (SSE stream)              SWOT/Porter     │
│  ← content_block_delta events            Recommendations  │
│       │                                  Forecast        │
│       ▼                                  Chat            │
│  parsePartialAnalysis()                               │  │
│  (renders each field as it completes)                 │  │
│                                                       │  │
│  localStorage  ─── session cache  ─────────────────── ┘  │
│  URL hash      ─── share payload (base64 JSON)           │
└──────────────────────────────────────────────────────────┘
```

The Vite dev server adds `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. These are required for DuckDB-WASM to use `SharedArrayBuffer`, which powers its multi-threaded query execution.

---

## How the Pieces Fit Together

**Step 1 — Ingestion.** The user drops a file (or pastes text, or fetches a URL). PapaParse or SheetJS converts it to `{ columns: string[], rows: object[] }`. For Excel files with multiple sheets, the user picks a sheet before analysis starts. For two-file joins, both datasets are parsed independently.

**Step 2 — Loading into DuckDB.** `loadDataset()` in [src/lib/sqlAnalysis.js](src/lib/sqlAnalysis.js) creates a DuckDB table named `dataset` (or `dataset1`/`dataset2` for joins). Column types are inferred from the sample: JavaScript numbers become `DOUBLE`, everything else becomes `VARCHAR`. Rows are inserted in batches of 100 to avoid building a single giant SQL string.

For joins, a SQL `VIEW` named `dataset` is created on top of the two tables using the user-selected key columns and join type (INNER / LEFT / RIGHT / FULL). Column name collisions from the second file get a `_2` suffix.

**Step 3 — Profiling.** `runProfileQueries()` runs a series of DuckDB SQL queries against the `dataset` table:
- For each numeric column: `COUNT`, `MIN`, `MAX`, `AVG`, `STDDEV`, `PERCENTILE_CONT(0.25)`, `PERCENTILE_CONT(0.75)`. Values more than 2 standard deviations from the mean are flagged as anomalies.
- For each date column: `MIN`, `MAX`, `COUNT(DISTINCT ...)`.
- For each categorical column: `COUNT(DISTINCT ...)` and the top 5 values by frequency.
- If a date column and a numeric KPI column are both present, a time-series aggregation is run, followed by a linear regression using DuckDB's built-in `regr_slope`, `regr_intercept`, and `regr_r2` functions. The regression is fit against row number (1, 2, 3 …) as the x-axis, so it works with any date format without requiring date casting.

The output is a `dataProfile` object — pure JSON with no raw rows.

**Step 4 — AI analysis.** `analyzeWithClaude()` sends the sector name, benchmark table, data profile, column names, and first 5 sample rows to Claude via a streaming API call. The system prompt is marked `cache_control: ephemeral` so Anthropic caches it at the edge between calls.

The response is a single JSON object streamed as SSE. `parsePartialAnalysis()` is called at most once every 150 ms as chunks arrive. It tries `JSON.parse` first; if that fails (because the JSON is incomplete), it uses regex + depth-counting to extract each field independently. As each field completes — `kpis`, `issueTree`, `recommendations`, etc. — it is pushed into React state and the corresponding dashboard tab renders immediately.

**Step 5 — Display.** The `Dashboard` component renders nine tabs. Each tab reads from `analysisResult` via `AnalysisContext`. Skeleton cards are shown for any field that has not arrived yet. The streaming status badge updates its label based on how many characters have arrived, giving the user a rough sense of progress.

**Step 6 — Persistence.** After analysis completes, the result is written to `localStorage` under the key `bizlens_session`. On the next page load, if a session exists, a banner offers to restore it. Sharing encodes `analysisResult` + `profileSummary` + `sector` as `JSON → encodeURIComponent → btoa`, appended to the URL as `#share=<encoded>`.

---

## Quick Start

### Prerequisites

- Node.js 18 or later
- Chrome or Edge (Firefox does not enable `SharedArrayBuffer` without special configuration, which DuckDB-WASM requires)
- An Anthropic API key — without one the app runs in Mock Demo Mode

### Install

```bash
git clone https://github.com/prishabh3/BizLens.git
cd BizLens
npm install
```

### Configure

Create `.env` in the project root:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Do not add a `VITE_` prefix.** `VITE_` variables are bundled into the browser build. `ANTHROPIC_API_KEY` (no prefix) is only read by the Vite dev server process; it is injected into each proxied request server-side and never reaches the browser bundle. `vite.config.js` sets `import.meta.env.VITE_PROXY_READY = 'true'` at build time only when the key starts with `sk-ant-`, which tells the client-side code to route through the proxy.

If you use the legacy approach (`VITE_ANTHROPIC_API_KEY`) the key is embedded in the compiled JS — fine for local development, not for any shared or deployed environment.

### Run

```bash
npm run dev          # Development server at http://localhost:5173
npm run build        # Production build into dist/
npm run preview      # Serve the production build locally
npm run test         # Run all 40 unit tests (Vitest, no browser required)
npm run test:watch   # Vitest in watch mode
npm run typecheck    # TypeScript type check (no emit)
```

### Mock Demo Mode

If no API key is configured, the app enters Mock Demo Mode automatically. A pre-built analysis result in [src/lib/mockData.js](src/lib/mockData.js) is streamed in 40-character chunks with 20 ms delays between chunks, so you can observe the streaming UI without an API key.

---

## Feature Walkthrough

This is the complete user journey from opening the app to viewing results.

**1. Open the app.** DuckDB-WASM begins loading immediately in a Web Worker. A status indicator in the "Generate Insights" button reads "Engine Init…" until it's ready (typically under 2 seconds).

**2. Load data.** Four ingestion paths exist:
- **File drop/browse** — drag a `.csv`, `.xlsx`, `.xls`, or `.txt` file onto the drop zone, or click to open a file picker.
- **URL import** — click "Import from URL / Google Sheets", paste a public Google Sheets URL or any direct CSV URL. Google Sheets URLs are automatically converted to the CSV export endpoint (`/export?format=csv`).
- **Paste text** — click "Paste text manually" and type or paste comma-separated or tab-separated data directly.
- **Sample dataset** — click "Load sample dataset" to fetch `sample_hospital.csv` from the public folder (a hospital operations dataset).

For Excel files with multiple sheets, a sheet picker appears after upload. For two-dataset joins, click "Add second file (join)", upload a second file, then configure the join type and key columns.

**3. Preview.** A data preview table shows the first 4 rows and up to 6 columns, with a row count badge.

**4. Select industry.** Choose from: Healthcare / SHaPE, Technology Media & Telecommunications, Public & Social Sector, Retail & Consumer Goods, Financial Services, General Business. This selects which set of 10 industry benchmarks is included in the Claude prompt.

**5. Generate Insights.** Click the button. The app transitions to the "analyzing" screen. A dot-progress indicator updates as the JSON streams in (`Parsing structure… → Building KPIs… → Generating issue tree… → Writing recommendations… → Assessing SWOT & Porter's… → Finalising analysis…`).

**6. Explore the dashboard.** Nine tabs are available:

| Tab | What it shows |
|---|---|
| Issue Tree | Root problem → branches (high/medium/low severity) → data-supported leaf findings, collapsible |
| Hypotheses | Confidence-scored hypotheses with evidence summary and data gap identification |
| Recommendations | SCR-format cards (Situation / Complication / Resolution) with quantified expected outcome |
| SWOT & Porter's | 2×2 SWOT matrix + five forces with 1–5 ratings |
| Scenarios | Base / Optimistic / Pessimistic projections with likelihood |
| Forecast | Linear regression trend line over historical data + projected future periods (F+1, F+2 …) |
| Data Charts | KPI vs benchmark bars, time-series lines, categorical distributions, numeric range strips |
| Methodology | The exact DuckDB SQL queries run, column type inference decisions, detected anomalies |
| Data Consultant | Natural language chat; Claude writes DuckDB SQL, the app executes it, results render as table + auto-chart |

**7. Export or share.** Click "Export" for a PDF (4-page slide deck: cover, KPIs, issue tree, recommendations) or an Excel workbook (6 sheets: KPIs, Recommendations, Hypotheses, SWOT, Scenarios, Summary). Click "Share" to copy a URL containing the full analysis encoded in the URL hash — anyone with the link sees the complete dashboard, no account needed.

---

## API Reference

BizLens has no public HTTP API — it is a client-side application. The only HTTP route is the Vite dev server proxy:

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/claude` | Server-side (key injected by proxy) | Forwards to `https://api.anthropic.com/v1/messages`, adds `x-api-key`, `anthropic-version`, and `anthropic-beta` headers |

This proxy is only available during `npm run dev`. A production build has no server; you would need to deploy your own proxy or use the legacy `VITE_ANTHROPIC_API_KEY` approach with the direct browser access header.

**Example request body (analysis):**

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 4000,
  "stream": true,
  "system": [
    {
      "type": "text",
      "text": "You are a BizLens AI senior analyst...",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": "Sector: Healthcare / SHaPE\n\nKnown industry benchmarks...\n\nDataset Profile (from DuckDB SQL analysis):\n{...}"
    }
  ]
}
```

**Example request body (data chat):**

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1500,
  "system": [
    {
      "type": "text",
      "text": "You are a data analyst with access to this dataset profile: {...}",
      "cache_control": { "type": "ephemeral" }
    }
  ],
  "messages": [
    { "role": "user", "content": "What are the top 5 departments by cost?" },
    { "role": "assistant", "content": "```sql\nSELECT department, SUM(cost) ...\n```" },
    { "role": "user", "content": "Which one grew fastest year over year?" }
  ]
}
```

The analysis call uses `stream: true` and reads SSE `content_block_delta` events. The chat call uses a standard non-streaming request and reads `data.content[0].text`.

---

## In-Memory Database Layout

There is no persistent database. DuckDB-WASM creates tables in memory during each analysis session. They are gone when the tab is closed.

**Tables created during a single-file analysis:**

| Table | When it exists | Contents |
|---|---|---|
| `dataset` | During analysis | One row per input row; numeric columns typed `DOUBLE`, all others `VARCHAR` |

**Tables created during a two-file join:**

| Table | When it exists | Contents |
|---|---|---|
| `dataset1` | During analysis | Primary file rows |
| `dataset2` | During analysis | Secondary file rows |
| `dataset` (VIEW) | During analysis | Result of `dataset1 JOIN dataset2` on user-selected keys |

Column name collisions between the two files (excluding the join key) get a `_2` suffix on the secondary file's column.

**Profiling queries produce (but do not store) these shapes:**

For numeric columns:
```
{ type, nonNullCount, nullCount, min, max, avg, stddev, p25, p75 }
```

For date columns:
```
{ type, nonNullCount, minDate, maxDate, distinctCount }
```

For categorical columns:
```
{ type, nullCount, distinctCount, topValues: [{ value, count }] }
```

For time-series + forecast (when a date column and a KPI column are both present):
```
timeSeries: { dateColumn, valueColumn, data: [{ period, value, count }] }
forecast:   { dateColumn, valueColumn, slope, intercept, r2, trend, data: [{ period, actual, trend, forecast }] }
```

**Persistent storage** uses `localStorage` under the key `bizlens_session`:
```
{ analysisResult, dataProfile, sector, columns, savedAt }
```

---

## Key Design Decisions

### DuckDB singleton via shared promise

`initDuckDB()` in [src/lib/duckdb.js](src/lib/duckdb.js) stores the init work in `initPromise`. Any concurrent calls to `initDuckDB()` before it resolves return the same promise, so the WASM module is only instantiated once regardless of how many components call the hook simultaneously.

### Proxy to keep the API key server-side

`ANTHROPIC_API_KEY` in `.env` (no `VITE_` prefix) is never bundled into the browser build. Vite reads it server-side in `vite.config.js` and injects it as an `x-api-key` header on the proxy route. The browser only ever knows whether the proxy is ready (`VITE_PROXY_READY = 'true'`), not the key itself.

### Streaming + progressive JSON parsing

Claude returns a single large JSON object. Waiting for the full response before rendering would mean 8–12 seconds of blank dashboard. Instead, `parsePartialAnalysis()` is called at most once per 150 ms as SSE chunks arrive. It first tries `JSON.parse`; if that fails it uses three extraction functions:
- `extractString(key)` — regex match for `"key": "value"` with escaped-character handling
- `extractArray(key)` — finds the opening `[`, then walks character-by-character counting bracket depth to find the closing `]`, then parses the slice
- `extractObject(key)` — same approach with `{` and `}`

Each field is independent, so `kpis` can render while `recommendations` is still mid-stream.

The 150 ms throttle prevents the O(n) regex work from running on every single SSE chunk as the response grows (a 4,000-token response can arrive in 200+ chunks).

### Date columns stay as VARCHAR in DuckDB

Rather than casting date strings to DuckDB's `DATE` type (which would fail for non-ISO formats like `2023Q1`), columns detected as dates are loaded as `VARCHAR`. Profiling queries use `MIN` and `MAX` on the string values. The time-series aggregation groups by the string value directly. The linear regression uses `ROW_NUMBER()` as the x-axis instead of parsed dates, so it works across all 8 supported date formats.

### Linear regression forecasting

`regr_slope(val, rn)` and `regr_intercept(val, rn)` fit a line to the historical data, where `rn` is the row number from `ROW_NUMBER() OVER (ORDER BY date)`. The forecast appends `Math.max(3, Math.round(n * 0.2))` future periods labeled `F+1`, `F+2`, etc. `regr_r2` is included in the profile so Claude can reference model fit quality in its analysis.

### Prompt caching

The system prompt (the JSON schema instruction) is the same for every analysis call within a session. Marking it `cache_control: { type: 'ephemeral' }` tells Anthropic to cache it at the edge. This reduces latency by approximately 30% and API cost by approximately 60% when the cache is warm.

### URL-hash sharing without a backend

`encodeSharePayload()` serializes `analysisResult + profileSummary + sector` as `JSON → encodeURIComponent → btoa`. On load, `extractShareFromUrl()` checks for `#share=` in the hash, decodes it, and hydrates the dashboard directly — no server round-trip, no account needed. The URL can be very long for large analysis results.

### Anomaly detection threshold

The 2-standard-deviation rule (`ABS(val - mean) > 2 * stddev`) is a deliberate choice: it flags approximately 5% of values in a normal distribution, which is enough to surface genuine outliers without overwhelming the anomaly list. Results are capped at 5 outlier values per column.

### Batch inserts into DuckDB

Rows are inserted in batches of 100 rather than one `INSERT` per row (too slow) or one giant `VALUES` clause (can exceed browser memory on large files). 100 rows per batch is a practical balance between SQL string length and number of round-trips to the WASM worker.

---

## Testing

```bash
npm run test        # Single run, all suites
npm run test:watch  # Watch mode
```

40 tests across 5 suites, all running in jsdom (no browser required):

| File | Suite | Tests | What it covers |
|---|---|---|---|
| [claude.test.js](src/lib/__tests__/claude.test.js) | `parsePartialAnalysis` | 11 | Full JSON, partial streams, markdown fences, escaped quotes, null/empty inputs, each schema field independently |
| [sqlAnalysis.test.js](src/lib/__tests__/sqlAnalysis.test.js) | `isNumericColumn` / `isDateColumn` | 17 | JS numbers, numeric strings, mixed types, null filtering, zero, all 8 date formats, the 80% match threshold |
| [fileParser.test.js](src/lib/__tests__/fileParser.test.js) | `parseText` | 4 | CSV parsing, empty input, dynamic typing, empty line skipping |
| [sharing.test.js](src/lib/__tests__/sharing.test.js) | `encodeSharePayload` / `decodeSharePayload` | 3 | Round-trip fidelity, corrupted input, large payloads |
| [benchmarks.test.js](src/lib/__tests__/benchmarks.test.js) | `getBenchmarksForSector` / `formatBenchmarksForPrompt` | 5 | Known sectors, unknown sector fallback, sector count, prompt string format |

What the tests do not cover: React component rendering, the DuckDB integration (requires a real WASM binary), and the Anthropic API call (mocked by the test environment).

---

## Project Structure

```
BizLens/
├── .env                          # ANTHROPIC_API_KEY (never committed)
├── vite.config.js                # Proxy config, COOP/COEP headers, VITE_PROXY_READY injection
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config (strict, no emit)
├── public/
│   ├── sample_hospital.csv       # Demo dataset (hospital operations, ~200 rows)
│   ├── manifest.json             # PWA manifest
│   └── favicon.svg
├── src/
│   ├── main.jsx                  # Entry: mounts ErrorBoundary → ToastProvider → App
│   ├── App.jsx                   # Stage machine (upload → analyzing → dashboard), sharing, session restore
│   ├── lib/
│   │   ├── claude.js             # API call, SSE reader, parsePartialAnalysis, mock mode, proxy detection
│   │   ├── duckdb.js             # Singleton init, runQuery wrapper
│   │   ├── sqlAnalysis.js        # loadDataset, runProfileQueries, isNumericColumn, isDateColumn
│   │   ├── benchmarks.ts         # 60 benchmark metrics across 6 sectors, formatBenchmarksForPrompt
│   │   ├── sharing.ts            # encodeSharePayload, decodeSharePayload, buildShareUrl
│   │   ├── fileParser.js         # dispatchFile (CSV/Excel), parseText (paste mode)
│   │   ├── mockData.js           # Pre-built analysis result for demo mode
│   │   └── __tests__/
│   │       ├── claude.test.js
│   │       ├── sqlAnalysis.test.js
│   │       ├── fileParser.test.js
│   │       ├── sharing.test.js
│   │       └── benchmarks.test.js
│   ├── hooks/
│   │   ├── useAnalysis.js        # Orchestrates the full pipeline: load → profile → Claude → save session
│   │   ├── useDuckDB.js          # Initializes DuckDB on mount, exposes { conn, ready, error }
│   │   └── useSession.js         # localStorage read/write for session persistence
│   ├── context/
│   │   ├── AnalysisContext.jsx   # Shares { conn, analysisResult, dataProfile, sector, timings } to tree
│   │   └── ToastContext.jsx      # Global toast state and useToast() hook
│   └── components/
│       ├── FileUpload.jsx         # Upload UI, URL import, paste mode, sheet picker, join config
│       ├── AnalyzingScreen.jsx    # Progress screen shown during streaming
│       ├── Dashboard.jsx          # Tab navigation, streaming badge, share button, skeleton cards
│       ├── MetricCards.jsx        # KPI scorecard grid with status colors
│       ├── IssueTree.jsx          # Collapsible tree (root → branches → leaves)
│       ├── Hypotheses.jsx         # Hypothesis cards with confidence bars
│       ├── Recommendations.jsx    # SCR recommendation cards
│       ├── SWOTPorter.jsx         # SWOT 2×2 matrix + Porter's force ratings
│       ├── DataCharts.jsx         # Recharts suite: bar, line, range strips, category dist
│       ├── Forecasting.jsx        # Forecast chart: actual + trend + F+N projections
│       ├── Methodology.jsx        # SQL query log, type inference summary, anomaly list
│       ├── ChatInterface.jsx      # Chat UI, SQL extraction, DuckDB execution, auto-chart
│       ├── ExportButton.jsx       # PDF (jsPDF) and Excel (SheetJS) export, keyboard-accessible dropdown
│       ├── ErrorBoundary.jsx      # Catches unexpected React render errors
│       └── ToastContainer.jsx     # aria-live="polite" region always in the DOM
```

---

## Common Issues

**DuckDB fails to initialize / "SharedArrayBuffer is not defined"**

DuckDB-WASM requires `SharedArrayBuffer`, which browsers only enable under Cross-Origin Isolation. The Vite dev server sets the required headers automatically on `localhost`. If you open the built `dist/` folder directly as a file (`file://`), it will fail. Use `npm run preview` instead, or deploy behind a server that sets:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**App is stuck in Mock Demo Mode even though I set the API key**

Check that:
1. The key is named `ANTHROPIC_API_KEY` (no `VITE_` prefix) in `.env`.
2. The key starts with `sk-ant-` — the proxy detection checks this prefix exactly.
3. You restarted `npm run dev` after editing `.env` — Vite does not hot-reload `.env` changes.

Open the browser console and look for `"No Anthropic API key found. Returning mock analysis data."` to confirm mock mode is active.

**Firefox: analysis never starts**

Firefox requires the page to be in a secure context with specific headers for `SharedArrayBuffer`. The Vite dev server sets these, but Firefox's additional restriction on cross-origin isolation can still block WASM threads. Use Chrome or Edge during development.

**"Claude returned invalid JSON" error**

Claude occasionally produces a response that is not valid JSON (usually when `max_tokens` is hit mid-object, or when the model adds a preamble despite the instruction). The raw response is logged to the browser console. Retry — the system prompt is cached, so the retry costs only the input tokens for the user message.

**Excel file loads with wrong data**

Multi-sheet Excel files default to the first sheet. If your data is on a different sheet, use the sheet picker that appears after upload.

**Production build has no proxy**

`vite.config.js` configures the proxy for the dev server only. A `vite build` output is static HTML/JS/CSS — there is no Node.js process to proxy requests. Options for production:
- Deploy a small server (Express, Next.js API route, Cloudflare Worker) that adds the `x-api-key` header and forwards to Anthropic.
- Use `VITE_ANTHROPIC_API_KEY` (key exposed to browser) only for personal local builds, never for shared deployments.

**Large files are slow or crash the tab**

DuckDB-WASM runs in a shared browser memory space. Files above ~50,000 rows may cause slow inserts (the 100-row batch loop runs thousands of iterations) or exceed available heap. For large datasets, consider pre-aggregating outside the browser before uploading.

---

## License

MIT
