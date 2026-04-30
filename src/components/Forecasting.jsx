import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function TrendBadge({ trend, r2 }) {
  const config = {
    increasing: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Upward Trend' },
    decreasing: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Downward Trend' },
    flat: { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', label: 'Flat Trend' },
  };
  const c = config[trend] || config.flat;
  const confidence = r2 >= 0.8 ? 'High' : r2 >= 0.5 ? 'Moderate' : 'Low';
  const confColor = r2 >= 0.8 ? 'text-emerald-600' : r2 >= 0.5 ? 'text-amber-600' : 'text-red-500';

  return (
    <div className="flex flex-wrap gap-3">
      <span className={`text-[11px] font-bold px-3 py-1.5 border uppercase tracking-wide ${c.bg} ${c.color}`}>
        {c.label}
      </span>
      <span className={`text-[11px] font-bold px-3 py-1.5 border uppercase tracking-wide bg-gray-50 border-gray-200 ${confColor}`}>
        R² = {r2.toFixed(3)} — {confidence} Confidence
      </span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 px-4 py-3 text-xs shadow-lg">
      <p className="font-bold text-gray-800 mb-2">{label}</p>
      {payload.map((p) => (
        p.value !== null && (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        )
      ))}
    </div>
  );
};

export default function Forecasting({ forecast }) {
  if (!forecast || !forecast.data || forecast.data.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium text-gray-500">Forecasting requires a date column + numeric KPI column</p>
        <p className="text-xs text-gray-400 mt-1">Ensure your dataset has a date/time column for trend analysis</p>
      </div>
    );
  }

  const forecastStart = forecast.data.findIndex((d) => d.forecast !== null);
  const splitLabel = forecastStart > 0 ? forecast.data[forecastStart - 1].period : null;

  const changePerPeriod = forecast.slope;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-serif-heading text-xl font-bold text-gray-900 mb-1">
          Predictive Forecast — {forecast.valueColumn}
        </h3>
        <p className="text-[13px] text-gray-500">
          Linear regression fitted on {forecast.data.filter((d) => d.actual !== null).length} historical periods.
          Projected {forecast.data.filter((d) => d.forecast !== null).length} periods forward.
        </p>
      </div>

      <TrendBadge trend={forecast.trend} r2={forecast.r2} />

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Trend Direction', value: forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1) },
          { label: 'Change per Period', value: `${changePerPeriod > 0 ? '+' : ''}${Number(changePerPeriod.toFixed(2)).toLocaleString()}` },
          { label: 'Model Fit (R²)', value: forecast.r2.toFixed(3) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-100 p-4 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-lg font-light text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Actual vs Trend vs Forecast
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={forecast.data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />

            {splitLabel && (
              <ReferenceLine
                x={splitLabel}
                stroke="#9CA3AF"
                strokeDasharray="4 4"
                label={{ value: 'Forecast →', position: 'insideTopRight', fontSize: 10, fill: '#9CA3AF' }}
              />
            )}

            <Bar dataKey="actual" name="Actual" fill="#E5E7EB" radius={0} />
            <Line
              type="monotone"
              dataKey="trend"
              name="Trend line"
              stroke="#2251FF"
              strokeWidth={2}
              dot={false}
              strokeDasharray="0"
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Forecast"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#10B981' }}
              strokeDasharray="6 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-400 italic">
        Model: Ordinary Least Squares linear regression (DuckDB REGR_SLOPE / REGR_INTERCEPT). R² measures variance explained by the trend line.
        Forecasts assume trend continuation — actual results will vary with market conditions.
      </p>
    </div>
  );
}
