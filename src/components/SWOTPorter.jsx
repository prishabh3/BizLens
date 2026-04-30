const SWOT_CONFIG = {
  strengths:     { label: 'Strengths',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  weaknesses:    { label: 'Weaknesses',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500' },
  opportunities: { label: 'Opportunities', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-[#2251FF]' },
  threats:       { label: 'Threats',       color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },
};

const FORCE_CONFIG = [
  { key: 'supplierPower',      label: 'Supplier Power' },
  { key: 'buyerPower',         label: 'Buyer Power' },
  { key: 'competitiveRivalry', label: 'Competitive Rivalry' },
  { key: 'threatOfSubstitution', label: 'Threat of Substitution' },
  { key: 'threatOfNewEntrants',  label: 'Threat of New Entrants' },
];

function RatingBar({ rating }) {
  const pct = (rating / 5) * 100;
  const color = rating >= 4 ? 'bg-red-500' : rating >= 3 ? 'bg-amber-500' : 'bg-emerald-500';
  const label = rating >= 4 ? 'High' : rating >= 3 ? 'Medium' : 'Low';
  const textColor = rating >= 4 ? 'text-red-600' : rating >= 3 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-bold w-12 text-right ${textColor}`}>{label} ({rating}/5)</span>
    </div>
  );
}

function SWOTQuadrant({ quadrant, items }) {
  const c = SWOT_CONFIG[quadrant];
  return (
    <div className={`p-5 border ${c.border} ${c.bg}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${c.color}`}>{c.label}</p>
      <ul className="space-y-2">
        {(items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
            <p className="text-[13px] text-gray-700 leading-snug">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SWOTAnalysis({ swot }) {
  if (!swot) return null;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-heading text-xl font-bold text-gray-900 mb-1">SWOT Analysis</h3>
        <p className="text-[13px] text-gray-500">Data-derived assessment of internal capabilities and external environment</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SWOTQuadrant quadrant="strengths"     items={swot.strengths} />
        <SWOTQuadrant quadrant="weaknesses"    items={swot.weaknesses} />
        <SWOTQuadrant quadrant="opportunities" items={swot.opportunities} />
        <SWOTQuadrant quadrant="threats"       items={swot.threats} />
      </div>
    </div>
  );
}

export function PortersFiveForces({ forces }) {
  if (!forces) return null;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-heading text-xl font-bold text-gray-900 mb-1">Porter's Five Forces</h3>
        <p className="text-[13px] text-gray-500">Competitive intensity assessment — higher rating = greater pressure</p>
      </div>
      <div className="space-y-4">
        {FORCE_CONFIG.map(({ key, label }) => {
          const force = forces[key];
          if (!force) return null;
          return (
            <div key={key} className="bg-white border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold text-gray-800">{label}</p>
              </div>
              <RatingBar rating={force.rating} />
              <p className="text-[12px] text-gray-600 mt-2 leading-relaxed">{force.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LIKELIHOOD_STYLE = {
  high:   { text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  medium: { text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  low:    { text: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
};

export function ScenarioModeling({ scenarios }) {
  if (!scenarios || scenarios.length === 0) return null;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif-heading text-xl font-bold text-gray-900 mb-1">Scenario Modeling</h3>
        <p className="text-[13px] text-gray-500">Three-point analysis: base, optimistic, and pessimistic projections</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {scenarios.map((s, i) => {
          const style = LIKELIHOOD_STYLE[s.likelihood] || LIKELIHOOD_STYLE.medium;
          return (
            <div key={i} className="bg-white border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-gray-900 text-[14px] font-serif-heading">{s.name}</p>
                <span className={`text-[10px] font-bold px-2 py-1 border uppercase tracking-wide flex-shrink-0 ${style.bg} ${style.text}`}>
                  {s.likelihood}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assumption</p>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{s.assumption}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Projected Impact</p>
                  <p className="text-[12px] font-semibold text-gray-800 leading-relaxed">{s.projectedImpact}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SWOTPorter({ analysisResult }) {
  if (!analysisResult) return null;
  return (
    <div className="space-y-12">
      <SWOTAnalysis swot={analysisResult.swot} />
      <PortersFiveForces forces={analysisResult.portersFiveForces} />
      <ScenarioModeling scenarios={analysisResult.scenarios} />
    </div>
  );
}
