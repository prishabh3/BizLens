const STAGES = [
  { threshold: 0,    label: 'Loading dataset into DuckDB…',        icon: 'db' },
  { threshold: 50,   label: 'Profiling columns & statistics…',      icon: 'chart' },
  { threshold: 150,  label: 'Detecting time-series & anomalies…',   icon: 'search' },
  { threshold: 300,  label: 'Running linear regression…',           icon: 'trend' },
  { threshold: 500,  label: 'Streaming AI analysis…',               icon: 'ai' },
  { threshold: 1200, label: 'Building issue tree…',                 icon: 'tree' },
  { threshold: 2000, label: 'Writing recommendations…',             icon: 'doc' },
  { threshold: 3000, label: 'Finalising strategic insights…',       icon: 'done' },
];

function StageIcon({ icon }) {
  const cls = 'w-5 h-5 text-[#2251FF]';
  if (icon === 'db')     return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.657 4.03 3 9 3s9-1.343 9-3V5" /><path d="M3 12c0 1.657 4.03 3 9 3s9-1.343 9-3" /></svg>;
  if (icon === 'chart')  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
  if (icon === 'search') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
  if (icon === 'trend')  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
  if (icon === 'ai')     return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
  if (icon === 'tree')   return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg>;
  if (icon === 'doc')    return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

export default function AnalyzingScreen({ streamingText }) {
  const chars = streamingText?.length ?? 0;

  const currentStageIdx = STAGES.reduce((acc, s, i) => (chars >= s.threshold ? i : acc), 0);
  const currentStage = STAGES[currentStageIdx];
  const progressPct = Math.min(95, (currentStageIdx / (STAGES.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans-body" role="status" aria-label="Analyzing your data">
      <div className="h-1.5 w-full bg-[#2251FF]" aria-hidden="true" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-10">

          {/* Logo */}
          <div>
            <span className="font-serif-heading font-bold text-gray-900 text-xl tracking-tight">BizLens</span>
          </div>

          {/* Spinner + label */}
          <div className="flex items-center gap-5">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16"
                  fill="none"
                  stroke="#2251FF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPct} ${100 - progressPct}`}
                  style={{ transition: 'stroke-dasharray 0.8s ease', transformOrigin: 'center' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#2251FF]">{Math.round(progressPct)}%</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">In Progress</p>
              <p className="text-[15px] font-medium text-gray-800 leading-snug" aria-live="polite">
                {currentStage.label}
              </p>
            </div>
          </div>

          {/* Step list */}
          <div className="space-y-3" aria-label="Analysis stages">
            {STAGES.map((stage, i) => {
              const done = i < currentStageIdx;
              const active = i === currentStageIdx;
              return (
                <div key={i} className={`flex items-center gap-3 transition-opacity ${i > currentStageIdx + 1 ? 'opacity-25' : 'opacity-100'}`}>
                  <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 border transition-colors
                    ${done ? 'bg-[#2251FF] border-[#2251FF]' : active ? 'border-[#2251FF] bg-white' : 'border-gray-200 bg-white'}`}>
                    {done ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#2251FF] animate-pulse' : 'bg-gray-300'}`} aria-hidden="true" />
                    )}
                  </div>
                  <span className={`text-[12px] ${done ? 'text-gray-400 line-through' : active ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                  {active && <StageIcon icon={stage.icon} />}
                </div>
              );
            })}
          </div>

          {/* Live token preview */}
          {streamingText && streamingText.length > 200 && (
            <div className="border border-gray-100 bg-[#F5F5F5] p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">AI Output Stream</p>
              <p className="text-[11px] font-mono text-gray-500 leading-relaxed">
                {streamingText.slice(-160)}
                <span className="animate-pulse text-[#2251FF]">▌</span>
              </p>
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            Your data never leaves this browser — all computation is local.
          </p>
        </div>
      </div>
    </div>
  );
}
