const STATUS_STYLES = {
    good: { text: 'text-[#2251FF]', bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-[#2251FF]' },
    warning: { text: 'text-amber-600', bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-amber-500' },
    critical: { text: 'text-red-600', bg: 'bg-[#F5F5F5]', border: 'border-l-4 border-red-600' },
};

function MetricCard({ kpi }) {
    const s = STATUS_STYLES[kpi.status] || STATUS_STYLES.warning;
    return (
        <div className={`p-6 ${s.bg} ${s.border}`}>
            <div className="flex flex-col mb-4">
                <p className="text-[14px] font-bold text-gray-900 leading-snug font-serif-heading mb-1">{kpi.name}</p>
                <span className={`text-[11px] font-bold uppercase tracking-widest ${s.text}`}>{kpi.status}</span>
            </div>
            <p className="text-3xl font-light text-gray-900 mb-3">{kpi.value}</p>

            {kpi.benchmark && (
                <div className="pt-3 border-t border-gray-200">
                    <p className="text-[12px] text-gray-500">Benchmark: <span className="text-gray-900 font-medium">{kpi.benchmark}</span></p>
                </div>
            )}
            {kpi.delta && (
                <p className={`text-[13px] font-bold mt-1 ${s.text}`}>{kpi.delta}</p>
            )}
        </div>
    );
}

export default function MetricCards({ kpis }) {
    if (!kpis || kpis.length === 0) return null;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => <MetricCard key={i} kpi={kpi} />)}
        </div>
    );
}
