function confidenceTier(value) {
    if (value > 65) return { accent: 'border-l-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700' };
    if (value >= 40) return { accent: 'border-l-amber-500', bar: 'bg-amber-500', text: 'text-amber-700' };
    return { accent: 'border-l-red-500', bar: 'bg-red-500', text: 'text-red-700' };
}

function ConfidenceBar({ value, tier }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                <span className={`text-[12px] font-bold ${tier.text}`}>{value}%</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5">
                <div
                    className={`h-1.5 transition-all duration-500 ${tier.bar}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
}

export default function Hypotheses({ hypotheses }) {
    if (!hypotheses || hypotheses.length === 0) return null;
    return (
        <div className="space-y-2.5">
            {hypotheses.map((h, i) => {
                const tier = confidenceTier(h.confidence);
                const num = String(i + 1).padStart(2, '0');
                return (
                    <div key={i} className={`bg-white border border-gray-200 border-l-4 ${tier.accent} p-5`}>
                        <div className="flex items-start gap-4 mb-4">
                            <span className="font-serif-heading text-2xl font-bold text-gray-200 leading-none tabular-nums mt-0.5">
                                {num}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-serif-heading font-bold text-gray-900 text-[15px] leading-snug">{h.title}</h4>
                                <p className="text-[13px] text-gray-600 mt-1 leading-relaxed">{h.description}</p>
                            </div>
                        </div>

                        <ConfidenceBar value={h.confidence} tier={tier} />

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 border border-gray-100">
                            <div className="bg-white p-4">
                                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5">Evidence</p>
                                <p className="text-[12px] text-gray-700 leading-relaxed">{h.evidence}</p>
                            </div>
                            <div className="bg-white p-4">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1.5">Data Gap</p>
                                <p className="text-[12px] text-gray-700 leading-relaxed">{h.dataGap}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
