export type BenchmarkMap = Record<string, string>;
export type SectorBenchmarks = Record<string, BenchmarkMap>;

export const SECTOR_BENCHMARKS: SectorBenchmarks = {
  'Healthcare / SHaPE': {
    'average length of stay': '4.5 days (OECD)',
    'readmission rate': '15% (30-day, NHS)',
    'bed occupancy rate': '80% (optimal 75-85%)',
    'patient satisfaction': '4.2/5 (HCAHPS)',
    'cost per patient': '$8,500 (US acute care)',
    'mortality rate': '1.8% (in-hospital, OECD)',
    'emergency wait time': '4 hours (NHS target)',
    'staff to patient ratio': '1:4 (acute ward)',
    'operating room utilization': '75% (best practice)',
    'cancelled procedures rate': '3% (NHS benchmark)',
  },
  'Technology, Media & Telecommunications': {
    'annual churn rate': '5-7% (SaaS benchmark)',
    'net revenue retention': '110%+ (best-in-class)',
    'customer acquisition cost': '$300 (SMB SaaS)',
    'arpu': '$150/month (mid-market)',
    'gross margin': '70-80% (SaaS)',
    'cac payback period': '18 months (SaaS)',
    'monthly active users growth': '10% MoM (growth stage)',
    'nps score': '40+ (tech industry)',
    'support ticket resolution time': '4 hours (SaaS)',
    'uptime sla': '99.9% (industry standard)',
  },
  'Retail & Consumer Goods': {
    'gross margin': '35% (retail average)',
    'inventory turnover': '6x annually',
    'return rate': '15% (e-commerce)',
    'average order value': '$75 (e-commerce)',
    'conversion rate': '2-3% (e-commerce)',
    'customer lifetime value': '$500 (retail)',
    'cart abandonment rate': '70% (benchmark)',
    'same-store sales growth': '3-5% (healthy)',
    'shrinkage rate': '1.4% (NRSS benchmark)',
    'sell-through rate': '80% (apparel benchmark)',
  },
  'Financial Services': {
    'return on equity': '10-12% (banking)',
    'net interest margin': '3% (US banking)',
    'cost to income ratio': '60% (banking)',
    'non-performing loan ratio': '1.5% (global)',
    'loan to deposit ratio': '80% (prudent level)',
    'capital adequacy ratio': '12%+ (Basel III)',
    'customer satisfaction nps': '30 (financial services)',
    'digital adoption rate': '65% (retail banking)',
    'fraud rate': '0.05% (card transactions)',
    'claims processing time': '10 days (insurance)',
  },
  'Public & Social Sector': {
    'program completion rate': '75% (government)',
    'cost per beneficiary': '$2,500 (social sector)',
    'overhead ratio': '15% (nonprofit best practice)',
    'service satisfaction': '65% (government services)',
    'policy compliance rate': '90% (regulatory target)',
    'service delivery time': '5 business days',
    'digital service adoption': '40% (gov digital)',
    'employee engagement': '55% (public sector)',
    'budget variance': '<5% (best practice)',
    'grant utilization rate': '85% (nonprofit)',
  },
  'General Business': {
    'revenue growth': '10-15% YoY (healthy)',
    'ebitda margin': '15-20% (industry average)',
    'operating margin': '10% (cross-industry)',
    'customer satisfaction': '4.0/5.0 (general)',
    'employee turnover': '15% (annual average)',
    'return on assets': '5% (cross-industry)',
    'debt to equity ratio': '1.5x (healthy)',
    'current ratio': '2.0 (liquidity benchmark)',
    'accounts receivable days': '30 days (best practice)',
    'net promoter score': '30 (cross-industry)',
  },
};

export function getBenchmarksForSector(sector: string): BenchmarkMap {
  return SECTOR_BENCHMARKS[sector] ?? SECTOR_BENCHMARKS['General Business'];
}

export function formatBenchmarksForPrompt(sector: string): string {
  const benchmarks = getBenchmarksForSector(sector);
  return Object.entries(benchmarks)
    .map(([metric, benchmark]) => `  - ${metric}: ${benchmark}`)
    .join('\n');
}
