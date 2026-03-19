function ConfidenceBar({ value }) {
    const color = value > 65 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500';
    const textColor = value > 65 ? 'text-emerald-700' : value >= 40 ? 'text-amber-700' : 'text-red-700';
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Confidence</span>
                <span className={`text-xs font-bold ${textColor}`}>{value}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
}

export default function Hypotheses({ hypotheses }) {
    if (!hypotheses || hypotheses.length === 0) return null;
    return (
        <div className="space-y-4">
            {hypotheses.map((h, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            H{i + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{h.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{h.description}</p>
                        </div>
                    </div>
                    <ConfidenceBar value={h.confidence} />
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Evidence</p>
                            <p className="text-xs text-gray-700">{h.evidence}</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Data Gap</p>
                            <p className="text-xs text-gray-700">{h.dataGap}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
