const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4000;

function getHeaders() {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  return {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

const BIZLENS_SYSTEM = `You are a BizLens AI senior analyst.
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
  "executiveSummary": "3-4 sentence professional executive summary paragraph"
}`;

export async function analyzeWithClaude(sector, dataProfile, columns, sampleRows) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key || key.includes('your-api-key') || key.trim() === '') {
    console.warn("No Anthropic API key found. Returning mock analysis data.");
    await new Promise(res => setTimeout(res, 2500)); // Simulate API delay
    return {
      "problemStatement": "Profitability in the core segment is lagging expected benchmarks due to higher-than-average operational spend relative to revenue generation.",
      "kpis": [
        { "name": "Average Revenue", "value": "$131,333", "benchmark": "$150,000", "status": "warning", "delta": "-12.4%" },
        { "name": "Customer Satisfaction", "value": "4.2", "benchmark": "4.0", "status": "good", "delta": "+5.0%" },
        { "name": "Operational Spend", "value": "$11,000", "benchmark": "$8,000", "status": "critical", "delta": "+37.5%" }
      ],
      "issueTree": {
        "root": "Lower profitability in core segment",
        "branches": [
          {
            "label": "Elevated Operational Spend",
            "description": "Costs are significantly higher than the industry average.",
            "severity": "high",
            "leaves": ["Campaigns in North America have highest spend", "Customer acquisition cost is rising"]
          },
          {
            "label": "Revenue Shortfalls",
            "description": "Revenue targets are missing by ~12%.",
            "severity": "medium",
            "leaves": ["European market underperforming", "Discounts reducing average deal size"]
          }
        ]
      },
      "hypotheses": [
        {
          "title": "Marketing inefficiency in NA",
          "description": "High marketing spend in North America is not yielding proportionate revenue growth.",
          "confidence": 85,
          "evidence": "Spend in NA is double Europe's, but revenue is only 50% higher.",
          "dataGap": "Channel-level marketing attribution data is required to confirm."
        }
      ],
      "recommendations": [
        {
          "title": "Optimize NA Marketing Spend",
          "impact": "high",
          "situation": "Marketing costs in North America are disproportionately high.",
          "complication": "If unaddressed, profitability will continue to erode.",
          "resolution": "Shift 20% of NA marketing budget to higher ROI channels in Asia Pacific.",
          "metric": "Increase overall margin by 4%"
        }
      ],
      "executiveSummary": "Our analysis indicates that while customer satisfaction remains strong across all regions, overall profitability is under pressure. This is primarily driven by elevated operational spend in the North American market that has not translated into proportionate revenue growth. By reallocating resources toward more efficient regions, we can significantly improve profit margins without sacrificing overall growth."
    };
  }

  const userMessage = `
Sector: ${sector}

Dataset Profile (from DuckDB SQL analysis):
${JSON.stringify(dataProfile, null, 2)}

Column names: ${columns.join(', ')}

Sample rows (first 5):
${JSON.stringify(sampleRows, null, 2)}

KPI columns detected: ${dataProfile.kpiColumns?.join(', ') || 'none'}
Time series columns detected: ${dataProfile.timeColumns?.join(', ') || 'none'}

Anomalies detected:
${JSON.stringify(dataProfile.anomalies, null, 2)}

Please analyze this data and return the structured JSON output as specified.
`;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: BIZLENS_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Claude response:', text);
    throw new Error('Claude returned invalid JSON. Raw response logged to console.');
  }
}

export async function chatWithClaude(messages, dataProfile) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key || key.includes('your-api-key') || key.trim() === '') {
    await new Promise(res => setTimeout(res, 1000));
    return "*(Mock Mode)* This is a simulated response because no Anthropic API key was found in the `.env` file. Add your API key to get real AI analysis!";
  }

  const systemPrompt = `You are a data analyst. You have access to this dataset profile:
${JSON.stringify(dataProfile, null, 2)}

Answer questions about the data concisely and helpfully.
If the user asks for a SQL query, write DuckDB-compatible SQL wrapped in a code block like:
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
      system: systemPrompt,
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
