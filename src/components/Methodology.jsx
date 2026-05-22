import { useMemo } from 'react';
import { useAnalysisCtx } from '../context/AnalysisContext';

function CodeBlock({ code }) {
  return (
    <pre className="bg-gray-900 text-gray-100 text-[11px] font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">
      {code}
    </pre>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className={`text-[12px] font-bold ${highlight ? 'text-[#2251FF]' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function computeDataQuality(dataProfile) {
  if (!dataProfile?.columns) return null;
  const cols = Object.values(dataProfile.columns);
  const numericCount = cols.filter((c) => c.type === 'numeric').length;
  const dateCount = cols.filter((c) => c.type === 'date').length;
  const anomalyPenalty = Math.min(20, (dataProfile.anomalies?.length ?? 0) * 3);
  const typeBonus = Math.min(10, (numericCount > 0 ? 5 : 0) + (dateCount > 0 ? 5 : 0));
  const forecastBonus = dataProfile.forecast ? Math.round(dataProfile.forecast.r2 * 10) : 0;
  const timeBonus = dataProfile.timeSeries ? 5 : 0;
  const score = Math.min(100, Math.max(0, 75 - anomalyPenalty + typeBonus + forecastBonus + timeBonus));
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
  const color = score >= 80 ? '#2251FF' : score >= 60 ? '#F59E0B' : '#EF4444';
  return { score, grade, color };
}

function DataQualityScore({ dataProfile }) {
  const q = computeDataQuality(dataProfile);
  if (!q) return null;

  return (
    <Section title="Data Quality Score">
      <div className="bg-white border border-gray-100 p-5 flex items-center gap-6">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9"
              fill="none"
              stroke={q.color}
              strokeWidth="3"
              strokeDasharray={`${q.score} ${100 - q.score}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-[11px] font-bold" style={{ color: q.color }}>{q.grade}</span>
            <span className="text-[9px] text-gray-400">{q.score}/100</span>
          </div>
        </div>
        <div className="space-y-1.5 flex-1">
          <p className="text-[13px] font-bold text-gray-800">
            {q.score >= 80 ? 'High-quality dataset' : q.score >= 60 ? 'Moderate quality dataset' : 'Dataset needs attention'}
          </p>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Score is based on anomaly rate, column diversity, time-series availability, and forecast confidence.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {dataProfile.timeSeries && <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 font-bold uppercase">Time-series</span>}
            {dataProfile.forecast && <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 font-bold uppercase">Forecast</span>}
            {(dataProfile.anomalies?.length ?? 0) === 0 && <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 font-bold uppercase">No anomalies</span>}
            {(dataProfile.anomalies?.length ?? 0) > 0 && <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 font-bold uppercase">{dataProfile.anomalies.length} anomalies</span>}
          </div>
        </div>
      </div>
    </Section>
  );
}

function PerformanceTimings({ timings }) {
  if (!timings) return null;
  return (
    <Section title="Performance Timings">
      <div className="bg-white border border-gray-100 p-4">
        <StatRow label="Data profiling" value={`${timings.profileMs} ms`} highlight />
        {timings.firstTokenMs !== null && (
          <StatRow label="First AI token" value={`${timings.firstTokenMs} ms`} highlight />
        )}
        <StatRow label="Total analysis" value={`${(timings.totalMs / 1000).toFixed(1)} s`} highlight />
      </div>
    </Section>
  );
}

export default function Methodology() {
  const { dataProfile, timings } = useAnalysisCtx();

  if (!dataProfile) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-sm">Run an analysis to see methodology details.</p>
    </div>
  );

  const hasCols = !!dataProfile.columns;
  const { numericCols, dateCols, categoricalCols } = useMemo(() => {
    if (!hasCols) return { numericCols: [], dateCols: [], categoricalCols: [] };
    const entries = Object.entries(dataProfile.columns);
    return {
      numericCols: entries.filter(([, v]) => v.type === 'numeric'),
      dateCols: entries.filter(([, v]) => v.type === 'date'),
      categoricalCols: entries.filter(([, v]) => v.type === 'categorical'),
    };
  }, [dataProfile.columns, hasCols]);

  const profilingSQL = `-- Row count
SELECT COUNT(*) as cnt FROM dataset;

-- Numeric column profiling (per column)
SELECT
  COUNT("col") as non_null_count,
  MIN("col") as min_val, MAX("col") as max_val,
  AVG("col") as avg_val, STDDEV("col") as stddev_val,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "col") as p25,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "col") as p75
FROM dataset WHERE "col" IS NOT NULL;

-- Anomaly detection (values > 2σ from mean)
SELECT "col" as val, COUNT(*) as cnt
FROM dataset
WHERE ABS("col" - {mean}) > {2 * stddev}
GROUP BY "col" LIMIT 5;

-- Top categorical values
SELECT "col" as val, COUNT(*) as cnt
FROM dataset WHERE "col" IS NOT NULL
GROUP BY "col" ORDER BY cnt DESC LIMIT 5;${dataProfile.forecast ? `

-- Linear regression for forecasting
WITH numbered AS (
  SELECT AVG("${dataProfile.forecast.valueColumn}") as val,
         ROW_NUMBER() OVER (ORDER BY "${dataProfile.forecast.dateColumn}") as rn
  FROM dataset
  WHERE "${dataProfile.forecast.dateColumn}" IS NOT NULL
  GROUP BY "${dataProfile.forecast.dateColumn}"
  ORDER BY "${dataProfile.forecast.dateColumn}"
)
SELECT
  regr_slope(val, rn)     AS slope,
  regr_intercept(val, rn) AS intercept,
  regr_r2(val, rn)        AS r_squared
FROM numbered;` : ''}`;

  return (
    <div className="space-y-10">

      <div>
        <h3 className="font-serif-heading text-xl font-bold text-gray-900 mb-1">Analysis Methodology</h3>
        <p className="text-[13px] text-gray-500">
          Complete transparency into how BizLens profiled your data — every inference decision and SQL query used.
        </p>
      </div>

      <DataQualityScore dataProfile={dataProfile} />

      <PerformanceTimings timings={timings} />

      {/* Dataset overview */}
      <Section title="Dataset Overview">
        <div className="bg-white border border-gray-100 p-4">
          <StatRow label="Total rows" value={dataProfile.rowCount?.toLocaleString()} />
          <StatRow label="Total columns" value={dataProfile.columnCount} />
          <StatRow label="Numeric columns" value={numericCols.length} highlight />
          <StatRow label="Date / time columns" value={dateCols.length} highlight />
          <StatRow label="Categorical columns" value={categoricalCols.length} />
          <StatRow label="Anomalies detected" value={dataProfile.anomalies?.length ?? 0} highlight={dataProfile.anomalies?.length > 0} />
          <StatRow label="KPI columns identified" value={dataProfile.kpiColumns?.join(', ') || 'None'} highlight={dataProfile.kpiColumns?.length > 0} />
          <StatRow label="Time-series detected" value={dataProfile.timeSeries ? `Yes — ${dataProfile.timeSeries.dateColumn} × ${dataProfile.timeSeries.valueColumn}` : 'No'} />
          <StatRow label="Forecast computed" value={dataProfile.forecast ? `Yes — R² = ${dataProfile.forecast.r2}` : 'No'} highlight={!!dataProfile.forecast} />
        </div>
      </Section>

      {/* Column type inference */}
      {hasCols && <Section title="Column Type Inference">
        <p className="text-[12px] text-gray-500">
          BizLens infers column types from values — not just column names. Date columns are detected via 8 regex patterns (ISO 8601, MM/DD/YYYY, YYYY-Qn, etc.).
          Numeric detection checks that all non-null values parse as numbers.
        </p>
        <div className="space-y-2">
          {Object.entries(dataProfile.columns).map(([col, info]) => (
            <div key={col} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <span className={`text-[10px] font-bold px-2 py-0.5 border uppercase tracking-wide w-20 text-center flex-shrink-0
                ${info.type === 'numeric' ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : info.type === 'date' ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {info.type}
              </span>
              <span className="text-[12px] font-medium text-gray-700 flex-1 truncate">{col}</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">
                {info.type === 'numeric' && `avg: ${Number(info.avg ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                {info.type === 'date' && `${info.minDate} → ${info.maxDate}`}
                {info.type === 'categorical' && `${info.distinctCount} unique values`}
              </span>
            </div>
          ))}
        </div>
      </Section>}

      {/* Anomalies */}
      {dataProfile.anomalies?.length > 0 && (
        <Section title={`Anomalies Detected (${dataProfile.anomalies.length})`}>
          <p className="text-[12px] text-gray-500">Values more than 2 standard deviations from the column mean.</p>
          <div className="space-y-3">
            {dataProfile.anomalies.map((a, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 p-4">
                <p className="text-[12px] font-bold text-amber-800 mb-1">{a.column}</p>
                <p className="text-[11px] text-amber-700">Mean: {a.mean} | Std Dev: {a.stddev}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.outliers.map((o, j) => (
                    <span key={j} className="text-[11px] bg-white border border-amber-300 px-2 py-0.5 text-amber-700">
                      {o.value} (×{o.count})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Forecast stats */}
      {dataProfile.forecast && (
        <Section title="Regression Model Parameters">
          <div className="bg-white border border-gray-100 p-4">
            <StatRow label="Date column" value={dataProfile.forecast.dateColumn} />
            <StatRow label="Value column" value={dataProfile.forecast.valueColumn} />
            <StatRow label="Slope (change per period)" value={dataProfile.forecast.slope} highlight />
            <StatRow label="Intercept" value={dataProfile.forecast.intercept} />
            <StatRow label="R² (variance explained)" value={dataProfile.forecast.r2} highlight />
            <StatRow label="Trend direction" value={dataProfile.forecast.trend} highlight />
          </div>
        </Section>
      )}

      {/* SQL queries */}
      <Section title="DuckDB SQL Queries Executed">
        <p className="text-[12px] text-gray-500">These are the exact queries run against your data in DuckDB-WASM.</p>
        <CodeBlock code={profilingSQL} />
      </Section>

      {/* Privacy note */}
      <div className="bg-[#F5F5F5] border-l-4 border-[#2251FF] p-5">
        <p className="text-[12px] font-bold text-gray-700 mb-1">Privacy Guarantee</p>
        <p className="text-[12px] text-gray-600 leading-relaxed">
          Your raw data never leaves this browser tab. DuckDB runs entirely in WebAssembly. Only the statistical profile above
          (min/max/avg/stddev/percentiles/top values) is sent to the Anthropic API — never individual rows.
          All computation happens locally on your device.
        </p>
      </div>
    </div>
  );
}
