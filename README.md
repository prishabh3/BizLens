# BizLens — AI Business Intelligence Platform

BizLens is an advanced, zero-backend business intelligence tool that brings enterprise-grade analytics natively into the browser. Built with a focus on data privacy and speed, the application allows users to upload any tabular dataset (CSV or Excel) and immediately receive a structured, professional-grade strategic analysis powered by DuckDB-WASM and Anthropic's Claude AI.

## Key Features

- **Zero-Backend Architecture:** All data parsing, OLAP SQL querying, and LLM communication happen 100% on the client. Your raw data never leaves the browser.
- **In-Browser Analytics Engine:** Integrates `DuckDB-WASM` to treat your flat files as an in-memory SQL database, enabling instant aggregations, profiling, and time-series analysis without crashing the UI thread.
- **AI Strategy Consultant:** Uses the Anthropic API to synthesize the mathematical data profiles into human-readable strategic outputs, simulating a premium management consulting report.
- **Structured Outputs:** Automatically formats insights into:
  - Executive Summaries
  - Dynamic KPI Scorecards (with benchmark comparisons)
  - Issue Trees
  - SCR (Situation-Complication-Resolution) Recommendations
- **Interactive Data Chat:** A natural-language interface that auto-generates and executes DuckDB SQL queries against your uploaded data, allowing for deeper exploration.
- **Report Generation:** Generates multi-page structural PDF slide decks locally via `jsPDF`.

## Technology Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Data Engine:** DuckDB-WASM
- **AI Integration:** Anthropic API (Claude)
- **Data Parsing:** PapaParse (CSV), SheetJS (XLSX)
- **Visuals:** Recharts, custom High-Contrast B2B UI Design

## Getting Started

### Prerequisites
- Node.js (v18+)
- An Anthropic API Key (for real AI analysis). *Note: The app includes a built-in "Mock Demo Mode" that generates a highly-realistic sample report automatically if no API key is provided, allowing you to test the architecture for free.*

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/prishabh3/BizLens.git
   cd BizLens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your API key (Optional for Mock Demo Mode):
   Create a `.env` file in the root directory and add:
   ```env
   VITE_ANTHROPIC_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5173`. We strongly recommend using **Google Chrome** due to the `SharedArrayBuffer` requirements for WebAssembly execution.

## How It Works Under the Hood

1. **Ingestion**: The user uploads a CSV/Excel file. `PapaParse` streams the file extremely fast into memory.
2. **Profiling**: DuckDB-WASM mounts the file and runs complex OLAP SQL queries to identify column types, calculate minimums/maximums/averages, find anomalies, and detect time series.
3. **Synthesis**: The aggregated "Data Profile" (never the raw rows) is passed to Claude, forced via rigorous system prompting into strict JSON schemas.
4. **Visualization**: The React application parses the JSON to automatically render the Metric Cards, Issue Trees, and formatted reports.

## License
This project is open-source and available under the MIT License.
