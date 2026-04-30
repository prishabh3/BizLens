import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

const BLUE = '#2251FF';
const NAVY = '#002D72';
const GRAY = '#6B7280';
const COLORS = [BLUE, NAVY, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const STATUS_COLOR = { good: '#10B981', warning: '#F59E0B', critical: '#EF4444' };

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
  );
}

// KPI benchmark comparison bars
function KPIChart({ kpis }) {
  if (!kpis || kpis.length === 0) return null;

  const data = kpis
    .filter((k) => {
      const val = parseFloat(String(k.value).replace(/[^0-9.-]/g, ''));
      const bench = parseFloat(String(k.benchmark || '').replace(/[^0-9.-]/g, ''));
      return !isNaN(val) && !isNaN(bench);
    })
    .map((k) => ({
      name: k.name.length > 18 ? k.name.slice(0, 16) + '…' : k.name,
      value: parseFloat(String(k.value).replace(/[^0-9.-]/g, '')),
      benchmark: parseFloat(String(k.benchmark || '').replace(/[^0-9.-]/g, '')),
      status: k.status,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <SectionLabel>KPI vs Benchmark</SectionLabel>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: GRAY }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }}
            formatter={(v) => v.toLocaleString()}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="value" name="Actual" radius={0}>
            {data.map((d, i) => (
              <Cell key={i} fill={STATUS_COLOR[d.status] || BLUE} />
            ))}
          </Bar>
          <Bar dataKey="benchmark" name="Benchmark" fill="#E5E7EB" radius={0} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Time series line chart
function TimeSeriesChart({ timeSeries }) {
  if (!timeSeries || !timeSeries.data || timeSeries.data.length < 3) return null;

  const data = timeSeries.data.map((d) => ({
    period: d.period.length > 10 ? d.period.slice(0, 10) : d.period,
    value: Number(d.value.toFixed(2)),
  }));

  return (
    <div>
      <SectionLabel>Trend: {timeSeries.valueColumn} over {timeSeries.dateColumn}</SectionLabel>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: GRAY }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10, fill: GRAY }} axisLine={false} tickLine={false} width={45} />
          <Tooltip
            contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }}
            formatter={(v) => v.toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={BLUE}
            strokeWidth={2}
            dot={data.length < 20 ? { r: 3, fill: BLUE } : false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Top categorical values bar chart
function CategoryChart({ col, data }) {
  if (!data || data.length === 0) return null;

  const chartData = data.topValues.map((v) => ({
    name: String(v.value).length > 14 ? String(v.value).slice(0, 13) + '…' : String(v.value),
    count: v.count,
  }));

  return (
    <div>
      <SectionLabel>Top Values: {col}</SectionLabel>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: GRAY }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: GRAY }} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 0, fontSize: 12 }} />
          <Bar dataKey="count" name="Count" radius={0}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Numeric distribution mini-chart (min/p25/avg/p75/max)
function NumericDistributionChart({ colName, colData }) {
  return (
    <div className="p-4 bg-white border border-gray-100">
      <p className="text-[12px] font-bold text-gray-700 mb-3 truncate">{colName}</p>
      <div className="grid grid-cols-5 gap-1 text-center">
        {[
          { label: 'Min', val: colData.min },
          { label: 'P25', val: colData.p25 },
          { label: 'Avg', val: colData.avg },
          { label: 'P75', val: colData.p75 },
          { label: 'Max', val: colData.max },
        ].map(({ label, val }) => (
          <div key={label}>
            <p className="text-[10px] text-gray-400 uppercase font-bold">{label}</p>
            <p className="text-[12px] font-semibold text-gray-800">
              {typeof val === 'number' ? (Math.abs(val) > 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(2)) : '—'}
            </p>
          </div>
        ))}
      </div>
      {/* Mini range bar */}
      <div className="mt-2 h-1.5 bg-gray-100 relative">
        {colData.max !== colData.min && (
          <>
            <div
              className="absolute h-full bg-[#2251FF]/20"
              style={{
                left: `${((colData.p25 - colData.min) / (colData.max - colData.min)) * 100}%`,
                width: `${((colData.p75 - colData.p25) / (colData.max - colData.min)) * 100}%`,
              }}
            />
            <div
              className="absolute h-full w-0.5 bg-[#2251FF]"
              style={{ left: `${((colData.avg - colData.min) / (colData.max - colData.min)) * 100}%` }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function DataCharts({ dataProfile, analysisResult }) {
  if (!dataProfile) return null;

  const numericCols = Object.entries(dataProfile.columns)
    .filter(([, v]) => v.type === 'numeric')
    .slice(0, 6);

  const categoricalCols = Object.entries(dataProfile.columns)
    .filter(([, v]) => v.type === 'categorical' && v.topValues?.length > 1)
    .slice(0, 3);

  return (
    <div className="space-y-10">

      {/* KPI benchmark comparison */}
      {analysisResult?.kpis && <KPIChart kpis={analysisResult.kpis} />}

      {/* Time series */}
      {dataProfile.timeSeries && <TimeSeriesChart timeSeries={dataProfile.timeSeries} />}

      {/* Numeric distributions */}
      {numericCols.length > 0 && (
        <div>
          <SectionLabel>Numeric Column Distributions</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {numericCols.map(([col, data]) => (
              <NumericDistributionChart key={col} colName={col} colData={data} />
            ))}
          </div>
        </div>
      )}

      {/* Categorical breakdowns */}
      {categoricalCols.length > 0 && (
        <div className="space-y-8">
          {categoricalCols.map(([col, data]) => (
            <CategoryChart key={col} col={col} data={data} />
          ))}
        </div>
      )}

      {numericCols.length === 0 && categoricalCols.length === 0 && !dataProfile.timeSeries && !analysisResult?.kpis && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No chart-ready columns detected in this dataset.</p>
          <p className="text-xs mt-1">Ensure your file contains numeric or categorical columns.</p>
        </div>
      )}
    </div>
  );
}
