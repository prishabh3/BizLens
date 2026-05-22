# BizLens — AI-Powered Business Intelligence Platform

> Zero-backend, in-browser analytics engine that transforms raw spreadsheets into executive-grade strategic reports using DuckDB-WASM and Anthropic Claude.

---

## The Problem

Small and mid-market businesses have data — spreadsheets, exports, CSVs — but lack the analyst bandwidth to extract insight from it. Enterprise BI tools (Tableau, Power BI) require cloud infrastructure, IT setup, and cost thousands per year. Hiring a consultant costs more.

**The gap:** no tool exists that gives a non-technical business owner a consulting-grade strategic analysis of their own data in under 60 seconds, for free, with zero setup.

---

## The Solution

BizLens runs entirely in the browser. Upload a CSV or Excel file. In under 60 seconds, receive:

- A structured **Issue Tree** (root cause → branches → data-supported findings)
- **KPIs benchmarked** against real industry standards
- **SWOT Analysis** and **Porter's Five Forces** assessment
- **SCR-format Recommendations** (Situation → Complication → Resolution)
- **Predictive Forecasting** on time-series columns
- **Scenario Modeling** (base, optimistic, pessimistic)
- A natural-language **Data Chat** interface with live SQL execution

No backend. No database. No data leaves the browser.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│                                                             │
│  CSV / Excel  →  PapaParse / SheetJS  →  DuckDB-WASM        │
│                                               ↓              │
│                SQL Profiling (OLAP queries in WASM)         │
│                              ↓                              │
│             Statistical Profile (never raw rows)            │
│                              ↓                              │
│                    Vite Dev Proxy  ──→  Anthropic Claude    │
│                (ANTHROPIC_API_KEY injected server-side)      │
│                              ↓                              │
│         Structured JSON → React Dashboard + Recharts        │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Decision | Rationale |
|---|---|
| **DuckDB-WASM over a backend** | Full OLAP SQL in the browser via WebAssembly. No server = no infrastructure cost, no data privacy risk. |
| **Vite proxy for API key** | `ANTHROPIC_API_KEY` lives only in `.env` (server-side). Never bundled into the browser. Proxy injects it per request. |
| **Streaming SSE over request-response** | Users see insights appear field-by-field (~1s to first content) vs waiting 8–12s for the full response. |
| **Prompt caching** | System prompt is cached at Anthropic edge. Reduces latency ~30% and API cost ~60% on repeated analyses. |
| **Profile-only AI input** | Claude receives statistical summaries (min/max/avg/stddev/percentiles), never raw rows. Keeps tokens low, privacy intact. |
| **Progressive JSON parsing** | Custom parser extracts completed JSON fields from the stream as they arrive — each section renders immediately. |
| **URL hash sharing** | Analysis results are compressed and encoded into a URL fragment. Shareable dashboards with zero backend. |
| **Promise-based DuckDB singleton** | Concurrent `initDuckDB()` calls share the same promise — no duplicate WASM initialisation race. |

---

## Performance

| Operation | Time |
|---|---|
| Parse 10,000-row CSV | ~120 ms |
| DuckDB SQL profiling (full column stats + anomaly detection) | ~400 ms |
| First streaming token from Claude | ~800 ms |
| Full analysis rendered | ~8–12 s |
| PDF export (4-page deck) | ~200 ms |
| Excel export (multi-sheet workbook) | ~150 ms |

---

## Feature Set

### Data Ingestion
- CSV, Excel (.xlsx/.xls) with **multi-sheet picker**, tab-delimited, paste text
- **Google Sheets import** — paste a public Sheets URL, auto-converts to CSV
- **Public URL import** — fetch any public CSV from the web
- **Multi-file join** — upload two datasets, configure join key and type (INNER / LEFT / RIGHT / FULL), DuckDB merges them before analysis

### Analytics Engine (DuckDB-WASM)
- Column type inference: numeric, categorical, and **date** (8 regex patterns — ISO 8601, MM/DD/YYYY, YYYY-Q quarters, and more)
- Full numeric profiling: min, max, avg, stddev, p25, p75
- Outlier detection: flags values > 2σ from mean
- Automatic time-series aggregation when date + KPI columns are present
- **Linear regression forecasting**: uses DuckDB's `regr_slope` / `regr_intercept` / `regr_r2` to fit trend lines and project forward

### AI Analysis (Claude Sonnet 4.6)
Seven structured outputs from a single streaming API call:
1. **Problem Statement** — one-sentence diagnosis
2. **KPI Scorecard** — values vs sector-specific benchmarks (60 metrics across 6 industries)
3. **Issue Tree** — root problem → branches → data-supported leaf findings
4. **Hypotheses** — confidence-scored with evidence and data gaps
5. **Recommendations** — SCR format (Situation / Complication / Resolution) with quantified expected outcomes
6. **SWOT Analysis** — data-derived strengths, weaknesses, opportunities, threats
7. **Porter's Five Forces** — competitive landscape assessment with 1–5 ratings
8. **Scenario Modeling** — base / optimistic / pessimistic projections

### Visualization (Recharts)
- KPI vs Benchmark bar charts
- Time-series line chart (auto-generated when date columns detected)
- Categorical distribution charts
- **Forecast chart** with confidence interval overlay
- Numeric distribution strips (min / p25 / avg / p75 / max with range bar)
- SQL query results auto-charted in the Data Chat

### Data Chat
- Natural language questions answered by Claude
- SQL queries auto-extracted and executed against the live DuckDB table
- Results rendered as both table and auto-detected chart (bar or line)
- **Retry** failed messages without duplicating conversation history
- Full conversation history maintained in-session

### Sharing & Export
- **Shareable URL** — encodes full analysis into URL hash; anyone with the link sees the complete dashboard
- **PDF Export** — 4-page slide deck (cover, KPI grid, Issue Tree, Recommendations) generated locally via jsPDF
- **Excel Export** — multi-sheet `.xlsx` workbook (KPIs, Recommendations, Hypotheses, SWOT, Scenarios, Summary)
- **Session Persistence** — last analysis cached in localStorage; restored on next visit

### Methodology Transparency
- Shows exact DuckDB SQL queries run during profiling
- Displays data type inference decisions per column
- Lists all detected anomalies with values and counts
- Shows which columns were classified as KPI vs time-series vs categorical

### Notifications & Accessibility
- **Toast notification system** — error / success / info / warning toasts with auto-dismiss and manual close
- `aria-live="polite"` region always present in the DOM (screen readers announced changes from page load)
- Keyboard accessible export dropdown (Escape to close)
- Error boundary catches unexpected React errors without crashing the whole app

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Analytics Engine | DuckDB-WASM 1.33 |
| AI | Anthropic Claude Sonnet 4.6 (streaming SSE + prompt caching) |
| Data Parsing | PapaParse (CSV), SheetJS/xlsx (Excel) |
| Visualization | Recharts |
| PDF Generation | jsPDF |
| Excel Generation | SheetJS/xlsx |
| Testing | Vitest (40+ unit tests) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- An Anthropic API key — optional, app runs in **Mock Demo Mode** without one

### Installation

```bash
git clone https://github.com/prishabh3/BizLens.git
cd BizLens
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
# Server-side only — never exposed to the browser
ANTHROPIC_API_KEY=sk-ant-...
```

> **Security note:** Use `ANTHROPIC_API_KEY` (no `VITE_` prefix). Vite's dev proxy injects this key server-side into each request. If you use the legacy `VITE_ANTHROPIC_API_KEY` instead, the key is bundled into the browser build — avoid this in production.

### Run

```bash
npm run dev        # Development server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build locally
npm run test       # Run unit tests (Vitest)
```

> **Chrome / Edge required** — DuckDB-WASM uses `SharedArrayBuffer`, which requires COOP/COEP headers. These are set automatically by the Vite dev server on `localhost`.

### Mock Demo Mode

If no API key is configured, BizLens runs in **Mock Demo Mode**: a pre-built analysis result streams in with simulated latency so you can explore the full dashboard UI without an API key.

---

## Project Structure

```
src/
├── lib/
│   ├── claude.js           # Streaming API, proxy-aware key detection, progressive JSON parser
│   ├── duckdb.js           # DuckDB-WASM singleton init (promise-based) + query runner
│   ├── sqlAnalysis.js      # Column profiling, date inference, time-series, forecasting
│   ├── benchmarks.js       # 60 industry benchmark metrics across 6 sectors
│   ├── sharing.js          # URL hash encode/decode for shareable dashboards
│   ├── fileParser.js       # CSV / Excel (multi-sheet) parsing dispatch
│   ├── mockData.js         # Pre-built mock analysis result for demo mode
│   └── __tests__/
│       ├── claude.test.js      # parsePartialAnalysis unit tests
│       └── sqlAnalysis.test.js # isNumericColumn / isDateColumn unit tests
├── hooks/
│   ├── useDuckDB.js        # DuckDB init lifecycle hook
│   └── useAnalysis.js      # Full analysis pipeline (profiling → Claude → state)
├── context/
│   └── ToastContext.jsx    # Global toast notification context + useToast hook
├── components/
│   ├── Dashboard.jsx       # Main dashboard with tab navigation
│   ├── FileUpload.jsx      # Upload, URL import, multi-sheet picker, join config
│   ├── DataCharts.jsx      # Recharts visualization suite
│   ├── Forecasting.jsx     # Linear regression forecast chart
│   ├── SWOTPorter.jsx      # SWOT matrix + Porter's Five Forces
│   ├── Scenarios.jsx       # Scenario modeling cards
│   ├── Methodology.jsx     # Transparency panel (SQL queries, type inference)
│   ├── MetricCards.jsx     # KPI scorecards
│   ├── IssueTree.jsx       # Collapsible issue tree
│   ├── Hypotheses.jsx      # Hypothesis cards with confidence bars
│   ├── Recommendations.jsx # SCR recommendation cards
│   ├── ChatInterface.jsx   # Data chat with SQL execution + charting
│   ├── ExportButton.jsx    # PDF + Excel export dropdown
│   ├── ErrorBoundary.jsx   # Top-level React error boundary
│   └── ToastContainer.jsx  # aria-live toast container (always in DOM)
├── App.jsx                 # Root: state, streaming, persistence, sharing
└── main.jsx                # Entry: ErrorBoundary + ToastProvider mount
```

---

## API Key Security

| Mode | Key location | How it reaches Anthropic |
|---|---|---|
| **Proxy mode** (recommended) | `.env` as `ANTHROPIC_API_KEY` | Vite dev server injects it server-side; never in browser bundle |
| **Legacy direct mode** | `.env` as `VITE_ANTHROPIC_API_KEY` | Bundled into browser — safe only for local dev, never deploy |
| **Mock mode** | No key | Pre-built mock data streamed locally |

The `VITE_PROXY_READY` flag is injected at build time by `vite.config.js` — `'true'` only when `ANTHROPIC_API_KEY` is a valid `sk-ant-*` key. This lets the browser-side code switch between proxy, legacy, and mock modes without ever seeing the actual key.

---

## Design Philosophy

**Privacy first.** Raw data never leaves the browser. DuckDB runs entirely in WebAssembly. Only statistical summaries (aggregates, percentiles, anomaly flags) reach the Claude API — never individual rows.

**Speed.** Streaming SSE means users see the first insight in under 1 second. Progressive JSON parsing reveals each dashboard section as it completes, not after the entire response finishes. The streaming callback is debounced to 150 ms to prevent O(n) regex work from compounding as the response grows.

**Consulting quality.** The issue tree, SCR recommendations, and Porter's analysis follow frameworks used by top-tier management consulting firms. The AI prompt enforces strict schema adherence via a system-level instruction with prompt caching.

**Accessible.** Toast notifications use an `aria-live` region that is always present in the DOM. Screen readers announce changes from page load without missing early notifications. The app is keyboard-navigable throughout.

---

## Testing

```bash
npm run test
```

40+ unit tests across two suites:

| Suite | What it covers |
|---|---|
| `claude.test.js` | `parsePartialAnalysis` — valid JSON, partial streams, markdown fences, escaped quotes, null cases |
| `sqlAnalysis.test.js` | `isNumericColumn` / `isDateColumn` — type inference edge cases, mixed formats, sparse columns |

---

## License

MIT — open source and free to use.
