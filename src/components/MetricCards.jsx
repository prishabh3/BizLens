import { useState, useEffect } from 'react';

const STATUS_STYLES = {
  good:     { text: 'text-[#2251FF]',  bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-[#2251FF]' },
  warning:  { text: 'text-amber-600',  bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-amber-500' },
  critical: { text: 'text-red-600',    bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-red-600' },
};

function useCountUp(rawValue, duration = 1100) {
  const [displayed, setDisplayed] = useState(rawValue);

  useEffect(() => {
    // Try to extract a leading number from the string, e.g. "78.5%" or "$12.4M"
    const match = String(rawValue).match(/^([^0-9-]*)(-?[\d,]+\.?\d*)(.*)$/);
    if (!match) { setDisplayed(rawValue); return; }

    const prefix = match[1];
    const numStr = match[2].replace(/,/g, '');
    const suffix = match[3];
    const target = parseFloat(numStr);
    if (isNaN(target)) { setDisplayed(rawValue); return; }

    const decimals = numStr.includes('.') ? (numStr.split('.')[1]?.length ?? 0) : 0;
    let startTime = null;

    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      const formatted = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString();
      setDisplayed(`${prefix}${formatted}${suffix}`);
      if (progress < 1) requestAnimationFrame(step);
    };

    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rawValue, duration]);

  return displayed;
}

function MetricCard({ kpi }) {
  const s = STATUS_STYLES[kpi.status] || STATUS_STYLES.warning;
  const animatedValue = useCountUp(kpi.value);

  return (
    <article className={`p-6 ${s.bg} ${s.border}`} aria-label={`${kpi.name}: ${kpi.value}`}>
      <div className="flex flex-col mb-4">
        <p className="text-[14px] font-bold text-gray-900 leading-snug font-serif-heading mb-1">{kpi.name}</p>
        <span className={`text-[11px] font-bold uppercase tracking-widest ${s.text}`} aria-label={`Status: ${kpi.status}`}>{kpi.status}</span>
      </div>
      <p className="text-3xl font-light text-gray-900 mb-3" aria-live="polite">{animatedValue}</p>

      {kpi.benchmark && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-[12px] text-gray-500">Benchmark: <span className="text-gray-900 font-medium">{kpi.benchmark}</span></p>
        </div>
      )}
      {kpi.delta && (
        <p className={`text-[13px] font-bold mt-1 ${s.text}`}>{kpi.delta}</p>
      )}
    </article>
  );
}

export default function MetricCards({ kpis }) {
  if (!kpis || kpis.length === 0) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" role="list" aria-label="Key Performance Indicators">
      {kpis.map((kpi, i) => <MetricCard key={i} kpi={kpi} />)}
    </div>
  );
}
