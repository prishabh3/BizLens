import { useState } from 'react';

const SEVERITY_STYLES = {
    high: { badge: 'bg-red-100 text-red-700 border-red-200', border: 'border-l-red-500', icon: '🔴' },
    medium: { badge: 'bg-amber-100 text-amber-700 border-amber-200', border: 'border-l-amber-500', icon: '🟡' },
    low: { badge: 'bg-blue-100 text-blue-700 border-blue-200', border: 'border-l-blue-500', icon: '🔵' },
};

function BranchRow({ branch }) {
    const [open, setOpen] = useState(true);
    const s = SEVERITY_STYLES[branch.severity] || SEVERITY_STYLES.medium;
    return (
        <div className={`border-l-4 ${s.border} bg-white rounded-r-xl border border-l-0 border-gray-100 overflow-hidden`}>
            <button
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setOpen((o) => !o)}
            >
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>
                    {branch.severity.toUpperCase()}
                </span>
                <span className="flex-1 font-semibold text-gray-800 text-sm">{branch.label}</span>
                <p className="text-xs text-gray-400 max-w-xs hidden sm:block">{branch.description}</p>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && branch.leaves && branch.leaves.length > 0 && (
                <div className="px-5 pb-4 space-y-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 mt-3 font-medium">{branch.description}</p>
                    {branch.leaves.map((leaf, i) => (
                        <div key={i} className="flex items-start gap-2 ml-4">
                            <span className="text-gray-300 font-bold mt-0.5">→</span>
                            <p className="text-sm text-gray-700">{leaf}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function IssueTree({ issueTree }) {
    if (!issueTree) return null;
    return (
        <div className="space-y-5">
            {/* Root */}
            <div className="bg-gray-900 text-white rounded-xl p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Root Problem</p>
                <p className="text-xl font-bold leading-snug">{issueTree.root}</p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-semibold">Issue Branches:</span>
                {['high', 'medium', 'low'].map((sev) => (
                    <span key={sev} className={`px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[sev].badge}`}>
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </span>
                ))}
            </div>

            {/* Branches */}
            <div className="space-y-3">
                {(issueTree.branches || []).map((branch, i) => (
                    <BranchRow key={i} branch={branch} />
                ))}
            </div>
        </div>
    );
}
