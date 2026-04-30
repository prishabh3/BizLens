import { formatBenchmarksForPrompt } from './benchmarks';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4000;

function getHeaders() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'prompt-caching-2024-07-31',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

const BIZLENS_SYSTEM_TEXT = `You are a BizLens AI senior analyst.
You analyze business data and produce structured strategic outputs in a professional consulting style.
Always respond in valid JSON only. No markdown, no preamble, no explanation outside JSON.

Your output must follow this exact JSON structure:
{
  "problemStatement": "One sentence defining the core business problem",
  "kpis": [
    {
      "name": "KPI name",
      "value": "value from data",
      "benchmark": "industry benchmark if known",
      "status": "good | warning | critical",
      "delta": "difference vs benchmark"
    }
  ],
  "issueTree": {
    "root": "Root problem statement",
    "branches": [
      {
        "label": "Branch name",
        "description": "What this branch covers",
        "severity": "high | medium | low",
        "leaves": ["Specific data-supported finding 1", "Specific data-supported finding 2"]
      }
    ]
  },
  "hypotheses": [
    {
      "title": "Hypothesis title",
      "description": "What this hypothesis claims",
      "confidence": 72,
      "evidence": "What in the data supports this",
      "dataGap": "What additional data would confirm or kill this"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "impact": "high | medium | low",
      "situation": "What the data shows (S in SCR)",
      "complication": "Why this is a problem (C in SCR)",
      "resolution": "What to do about it (R in SCR)",
      "metric": "Quantified expected outcome"
    }
  ],
  "swot": {
    "strengths": ["Data-supported strength 1", "Data-supported strength 2"],
    "weaknesses": ["Data-supported weakness 1", "Data-supported weakness 2"],
    "opportunities": ["Strategic opportunity 1", "Strategic opportunity 2"],
    "threats": ["External threat 1", "External threat 2"]
  },
  "portersFiveForces": {
    "supplierPower": { "rating": 3, "description": "Assessment of supplier bargaining power based on the data" },
    "buyerPower": { "rating": 4, "description": "Assessment of buyer bargaining power based on the data" },
    "competitiveRivalry": { "rating": 4, "description": "Intensity of competition in the sector" },
    "threatOfSubstitution": { "rating": 2, "description": "Risk of product/service substitution" },
    "threatOfNewEntrants": { "rating": 3, "description": "Barriers to entry in this market" }
  },
  "scenarios": [
    {
      "name": "Base Case",
      "assumption": "Current trends continue with no major interventions",
      "projectedImpact": "Quantified outcome (e.g. revenue stays flat at $X)",
      "likelihood": "high"
    },
    {
      "name": "Optimistic",
      "assumption": "Key recommendations are implemented successfully",
      "projectedImpact": "Quantified upside outcome",
      "likelihood": "medium"
    },
    {
      "name": "Pessimistic",
      "assumption": "External headwinds materialize without intervention",
      "projectedImpact": "Quantified downside outcome",
      "likelihood": "low"
    }
  ],
  "executiveSummary": "3-4 sentence professional executive summary paragraph"
}`;

// Try to extract completed fields from partial JSON text
function parsePartialAnalysis(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  // Try full parse first
  try {
    return JSON.parse(cleaned);
  } catch {}

  const result = {};

  const extractString = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
    const m = cleaned.match(re);
    if (!m) return null;
    return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  };

  const extractArray = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*(\\[)`, 's');
    const m = cleaned.match(re);
    if (!m) return null;
    const start = m.index + m[0].length - 1;
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '[' || cleaned[i] === '{') depth++;
      else if (cleaned[i] === ']' || cleaned[i] === '}') {
        depth--;
        if (depth === 0 && cleaned[i] === ']') {
          try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { return null; }
        }
      }
    }
    return null;
  };

  const extractObject = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*(\\{)`, 's');
    const m = cleaned.match(re);
    if (!m) return null;
    const start = m.index + m[0].length - 1;
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      else if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(cleaned.slice(start, i + 1)); } catch { return null; }
        }
      }
    }
    return null;
  };

  const ps = extractString('problemStatement');
  if (ps) result.problemStatement = ps;

  const kpis = extractArray('kpis');
  if (kpis) result.kpis = kpis;

  const issueTree = extractObject('issueTree');
  if (issueTree) result.issueTree = issueTree;

  const hypotheses = extractArray('hypotheses');
  if (hypotheses) result.hypotheses = hypotheses;

  const recommendations = extractArray('recommendations');
  if (recommendations) result.recommendations = recommendations;

  const swot = extractObject('swot');
  if (swot) result.swot = swot;

  const portersFiveForces = extractObject('portersFiveForces');
  if (portersFiveForces) result.portersFiveForces = portersFiveForces;

  const scenarios = extractArray('scenarios');
  if (scenarios) result.scenarios = scenarios;

  const es = extractString('executiveSummary');
  if (es) result.executiveSummary = es;

  return Object.keys(result).length > 0 ? result : null;
}

const MOCK_RESULT = {
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

export async function analyzeWithClaude(sector, dataProfile, columns, sampleRows, onChunk) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key || !key.startsWith('sk-ant-') || key.trim() === '') {
    console.warn('No Anthropic API key found. Returning mock analysis data.');
    // Simulate streaming with mock data
    const json = JSON.stringify(MOCK_RESULT, null, 2);
    const chunkSize = 40;
    for (let i = 0; i < json.length; i += chunkSize) {
      await new Promise((r) => setTimeout(r, 20));
      const partial = json.slice(0, i + chunkSize);
      onChunk?.(parsePartialAnalysis(partial));
    }
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_RESULT;
  }

  const sectorBenchmarks = formatBenchmarksForPrompt(sector);

  const userMessage = `Sector: ${sector}

Known industry benchmarks for this sector:
${sectorBenchmarks}

Dataset Profile (from DuckDB SQL analysis):
${JSON.stringify(dataProfile, null, 2)}

Column names: ${columns.join(', ')}

Sample rows (first 5):
${JSON.stringify(sampleRows, null, 2)}

KPI columns detected: ${dataProfile.kpiColumns?.join(', ') || 'none'}
Time series columns detected: ${dataProfile.timeColumns?.join(', ') || 'none'}
Date columns detected: ${dataProfile.dateColumns?.join(', ') || 'none'}

Anomalies detected:
${JSON.stringify(dataProfile.anomalies, null, 2)}

Use the sector benchmarks above as reference values when populating kpi.benchmark fields.
Please analyze this data and return the structured JSON output as specified.`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      system: [
        {
          type: 'text',
          text: BIZLENS_SYSTEM_TEXT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          fullText += event.delta.text;
          const partial = parsePartialAnalysis(fullText);
          if (partial) onChunk?.(partial);
        }
      } catch {}
    }
  }

  const cleaned = fullText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Claude response:', fullText);
    throw new Error('Claude returned invalid JSON. Raw response logged to console.');
  }
}

export async function chatWithClaude(messages, dataProfile) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key || !key.startsWith('sk-ant-') || key.trim() === '') {
    await new Promise((r) => setTimeout(r, 1000));
    return '*(Mock Mode)* This is a simulated response. Add your Anthropic API key to `.env` for real AI analysis.\n\n```sql\nSELECT * FROM dataset LIMIT 10;\n```\nThis query shows the first 10 rows of your dataset.';
  }

  const systemPrompt = `You are a data analyst with access to this dataset profile:
${JSON.stringify(dataProfile, null, 2)}

Answer questions about the data concisely and helpfully.
If the user asks for a SQL query, write DuckDB-compatible SQL in a code block:
\`\`\`sql
SELECT ...
\`\`\`
Then briefly explain what the query does.
Return answers in plain text (not JSON).`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}
