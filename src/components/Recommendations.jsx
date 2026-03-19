const IMPACT_STYLES = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
};

const SCR_FIELDS = [
    { key: 'situation', label: 'Situation', color: 'text-blue-700', bg: 'bg-blue-50' },
    { key: 'complication', label: 'Complication', color: 'text-amber-700', bg: 'bg-amber-50' },
    { key: 'resolution', label: 'Resolution', color: 'text-emerald-700', bg: 'bg-emerald-50' },
];

export default function Recommendations({ recommendations }) {
    if (!recommendations || recommendations.length === 0) return null;
    return (
        <div className="space-y-5">
            {recommendations.map((rec, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                R{i + 1}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{rec.title}</h4>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${IMPACT_STYLES[rec.impact] || IMPACT_STYLES.medium}`}>
                            {rec.impact?.toUpperCase()} IMPACT
                        </span>
                    </div>

                    {/* SCR Body */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                        {SCR_FIELDS.map(({ key, label, color, bg }) => (
                            <div key={key} className={`px-5 py-4 ${bg}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>{label}</p>
                                <p className="text-xs text-gray-700 leading-relaxed">{rec[key]}</p>
                            </div>
                        ))}
                    </div>

                    {/* Metric */}
                    {rec.metric && (
                        <div className="px-6 py-3 bg-gray-900 text-white">
                            <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Expected Outcome:</span>
                            <span className="text-xs font-semibold">{rec.metric}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
