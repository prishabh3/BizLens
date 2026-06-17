import { useState } from 'react';

const SEVERITY = {
    high:   { label: 'High',   accent: 'border-l-red-600',   tag: 'text-red-700 bg-red-50 border-red-200',     dot: 'bg-red-600',   rank: 1 },
    medium: { label: 'Medium', accent: 'border-l-amber-500', tag: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500', rank: 2 },
    low:    { label: 'Low',    accent: 'border-l-[#2251FF]', tag: 'text-[#2251FF] bg-blue-50 border-blue-200',   dot: 'bg-[#2251FF]', rank: 3 },
};

function BranchRow({ branch, index }) {
    const [open, setOpen] = useState(true);
    const s = SEVERITY[branch.severity] || SEVERITY.medium;
    const num = String(index + 1).padStart(2, '0');

    return (
        <div className={`bg-white border border-gray-200 border-l-4 ${s.accent}`}>
            <button
                className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-[#FAFAFA] transition-colors group"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={`${branch.label} — ${s.label} severity. ${open ? 'Collapse' : 'Expand'}`}
            >
                <span className="font-serif-heading text-2xl font-bold text-gray-200 leading-none tabular-nums mt-0.5 group-hover:text-gray-300 transition-colors">
                    {num}
                </span>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border ${s.tag}`}>
                            {s.label}
                        </span>
                        <span className="font-serif-heading font-bold text-gray-900 text-[15px] leading-snug truncate">
                            {branch.label}
                        </span>
                    </div>
                    {branch.description && (
                        <p className="text-[12px] text-gray-500 leading-relaxed">{branch.description}</p>
                    )}
                </div>

                <svg
                    className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 mt-1 group-hover:text-gray-500 ${open ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && branch.leaves?.length > 0 && (
                <div className="px-5 pb-4 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5 pl-11">
                        Data-Supported Findings
                    </p>
                    <ul className="space-y-0">
                        {branch.leaves.map((leaf, i) => (
                            <li key={i} className="flex items-start gap-3 pl-11 py-2 border-t border-gray-100">
                                <span className={`w-1.5 h-1.5 ${s.dot} mt-1.5 flex-shrink-0`} aria-hidden="true" />
                                <p className="text-[13px] text-gray-700 leading-relaxed">{leaf}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default function IssueTree({ issueTree }) {
    if (!issueTree) return null;

    const branches = [...(issueTree.branches || [])].sort(
        (a, b) => (SEVERITY[a.severity]?.rank ?? 2) - (SEVERITY[b.severity]?.rank ?? 2)
    );

    const counts = branches.reduce((acc, b) => {
        const key = SEVERITY[b.severity] ? b.severity : 'medium';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return (
        <div>
            {/* Root */}
            <div className="bg-[#002D72] border-l-4 border-[#2251FF] px-7 py-6">
                <p className="text-[11px] font-bold text-blue-300 uppercase tracking-widest mb-2">Root Problem</p>
                <p className="font-serif-heading text-2xl font-bold text-white leading-snug max-w-3xl">
                    {issueTree.root}
                </p>
            </div>

            {/* Connector + branch count */}
            <div className="flex items-center gap-4 pl-7 py-3">
                <span className="w-px h-5 bg-gray-300" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                    {branches.length} Issue Branch{branches.length === 1 ? '' : 'es'}
                </span>
                <div className="flex items-center gap-3 ml-auto">
                    {['high', 'medium', 'low'].map((sev) =>
                        counts[sev] ? (
                            <span key={sev} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                <span className={`w-2 h-2 ${SEVERITY[sev].dot}`} aria-hidden="true" />
                                {counts[sev]} {SEVERITY[sev].label}
                            </span>
                        ) : null
                    )}
                </div>
            </div>

            {/* Branches */}
            <div className="space-y-2.5">
                {branches.map((branch, i) => (
                    <BranchRow key={i} branch={branch} index={i} />
                ))}
            </div>
        </div>
    );
}
