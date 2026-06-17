const IMPACT = {
    high:   { label: 'High',   accent: 'border-l-red-600',   tag: 'text-red-700 bg-red-50 border-red-200' },
    medium: { label: 'Medium', accent: 'border-l-amber-500', tag: 'text-amber-700 bg-amber-50 border-amber-200' },
    low:    { label: 'Low',    accent: 'border-l-[#2251FF]', tag: 'text-[#2251FF] bg-blue-50 border-blue-200' },
};

const SCR_FIELDS = [
    { key: 'situation',    label: 'Situation',    color: 'text-[#2251FF]' },
    { key: 'complication', label: 'Complication', color: 'text-amber-700' },
    { key: 'resolution',   label: 'Resolution',   color: 'text-emerald-700' },
];

export default function Recommendations({ recommendations }) {
    if (!recommendations || recommendations.length === 0) return null;
    return (
        <div className="space-y-2.5">
            {recommendations.map((rec, i) => {
                const s = IMPACT[rec.impact] || IMPACT.medium;
                const num = String(i + 1).padStart(2, '0');
                return (
                    <div key={i} className={`bg-white border border-gray-200 border-l-4 ${s.accent}`}>
                        {/* Header */}
                        <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-100">
                            <span className="font-serif-heading text-2xl font-bold text-gray-200 leading-none tabular-nums mt-0.5">
                                {num}
                            </span>
                            <h4 className="flex-1 font-serif-heading font-bold text-gray-900 text-[15px] leading-snug mt-1">
                                {rec.title}
                            </h4>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border flex-shrink-0 mt-1 ${s.tag}`}>
                                {s.label} Impact
                            </span>
                        </div>

                        {/* SCR body */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                            {SCR_FIELDS.map(({ key, label, color }) => (
                                <div key={key} className="px-5 py-4">
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${color}`}>{label}</p>
                                    <p className="text-[13px] text-gray-700 leading-relaxed">{rec[key]}</p>
                                </div>
                            ))}
                        </div>

                        {/* Expected outcome */}
                        {rec.metric && (
                            <div className="px-5 py-3 bg-[#002D72] flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Expected Outcome</span>
                                <span className="text-[13px] font-semibold text-white">{rec.metric}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
