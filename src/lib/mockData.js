export const MOCK_RESULT = {
  problemStatement: 'Profitability in the core segment is lagging expected benchmarks due to higher-than-average operational spend relative to revenue generation.',
  kpis: [
    { name: 'Average Revenue', value: '$131,333', benchmark: '$150,000', status: 'warning', delta: '-12.4%' },
    { name: 'Customer Satisfaction', value: '4.2', benchmark: '4.0', status: 'good', delta: '+5.0%' },
    { name: 'Operational Spend', value: '$11,000', benchmark: '$8,000', status: 'critical', delta: '+37.5%' },
    { name: 'Net Margin', value: '8.2%', benchmark: '15%', status: 'warning', delta: '-6.8pp' },
  ],
  issueTree: {
    root: 'Lower profitability in core segment',
    branches: [
      {
        label: 'Elevated Operational Spend',
        description: 'Costs are significantly higher than the industry average.',
        severity: 'high',
        leaves: ['Campaigns in North America have highest spend', 'Customer acquisition cost is rising year-over-year'],
      },
      {
        label: 'Revenue Shortfalls',
        description: 'Revenue targets are missing by ~12%.',
        severity: 'medium',
        leaves: ['European market underperforming vs. peers', 'Discounts reducing average deal size by 18%'],
      },
    ],
  },
  hypotheses: [
    {
      title: 'Marketing inefficiency in NA',
      description: 'High marketing spend in North America is not yielding proportionate revenue growth.',
      confidence: 85,
      evidence: 'Spend in NA is double Europe\'s, but revenue is only 50% higher.',
      dataGap: 'Channel-level marketing attribution data is required to confirm.',
    },
    {
      title: 'Pricing power erosion',
      description: 'Increased discounting is masking underlying demand weakness.',
      confidence: 62,
      evidence: 'Average deal size has declined 18% while unit volume grew 5%.',
      dataGap: 'Competitor pricing data and elasticity analysis needed.',
    },
  ],
  recommendations: [
    {
      title: 'Optimize NA Marketing Spend',
      impact: 'high',
      situation: 'Marketing costs in North America are disproportionately high relative to returns.',
      complication: 'If unaddressed, profitability will continue to erode as fixed costs increase.',
      resolution: 'Shift 20% of NA marketing budget to higher-ROI channels in Asia Pacific.',
      metric: 'Increase overall margin by 4% within 2 quarters',
    },
    {
      title: 'Restructure Discount Policy',
      impact: 'medium',
      situation: 'Discounts are being applied broadly without revenue thresholds.',
      complication: 'Deal size compression is accelerating and reducing LTV.',
      resolution: 'Implement value-based pricing tiers and limit discounts to strategic accounts.',
      metric: 'Recover 18% of lost deal value; ~$2.1M incremental revenue',
    },
  ],
  swot: {
    strengths: ['Strong customer satisfaction score (4.2/5) above industry benchmark', 'Established presence across multiple regions with diversified revenue base'],
    weaknesses: ['Operational spend 37.5% above sector benchmark, eroding margin', 'Discount dependency reducing average deal size and LTV'],
    opportunities: ['Asia Pacific market underpenetrated relative to NA spend allocation', 'Pricing tier restructuring could recover 18% of compressed deal value'],
    threats: ['Rising customer acquisition costs may accelerate if NA market saturates', 'Competitor pricing pressure may limit ability to remove discounts without churn'],
  },
  portersFiveForces: {
    supplierPower: { rating: 2, description: 'Low supplier concentration; multiple vendors available for key inputs reducing dependency risk.' },
    buyerPower: { rating: 4, description: 'Buyers demonstrate high price sensitivity evidenced by 18% discount uptake; switching costs appear low.' },
    competitiveRivalry: { rating: 4, description: 'Intense rivalry indicated by margin compression and need for broad discounting to close deals.' },
    threatOfSubstitution: { rating: 3, description: 'Moderate substitution risk; market alternatives exist but current customer satisfaction limits immediate switching.' },
    threatOfNewEntrants: { rating: 2, description: 'Capital and relationship requirements create moderate barriers; established customer base provides some protection.' },
  },
  scenarios: [
    {
      name: 'Base Case',
      assumption: 'Current spend allocation and discount policy unchanged; organic revenue growth of 5% YoY',
      projectedImpact: 'Margin remains at 8.2%; absolute profit grows marginally but lags benchmark by 6.8pp',
      likelihood: 'high',
    },
    {
      name: 'Optimistic',
      assumption: '20% NA budget reallocation to APAC and pricing tier restructuring implemented within Q2',
      projectedImpact: 'Margin improves to 12.5% within 2 quarters; revenue recovers $2.1M from deal compression',
      likelihood: 'medium',
    },
    {
      name: 'Pessimistic',
      assumption: 'CAC continues to rise 15% QoQ; competitor undercutting forces deeper discounting',
      projectedImpact: 'Margin erodes to 5.1%; requires urgent cost restructuring to avoid operating loss',
      likelihood: 'low',
    },
  ],
  executiveSummary: 'Our analysis indicates that while customer satisfaction remains strong across all regions, overall profitability is under pressure. This is primarily driven by elevated operational spend in the North American market that has not translated into proportionate revenue growth. By reallocating resources toward more efficient regions and restructuring discount policies, we project a 4% improvement in overall margins within two quarters.',
};
