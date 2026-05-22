import { describe, it, expect } from 'vitest';

// parsePartialAnalysis is not exported by default because it's an internal
// implementation detail. We import it via the named re-export added during the
// architecture refactor.
import { parsePartialAnalysis } from '../claude';

describe('parsePartialAnalysis', () => {
  it('returns a full object when given valid complete JSON', () => {
    const obj = {
      problemStatement: 'Revenue is declining.',
      kpis: [{ name: 'Revenue', value: '$1M', benchmark: '$1.2M', status: 'warning', delta: '-16.7%' }],
      executiveSummary: 'Short summary.',
    };
    const result = parsePartialAnalysis(JSON.stringify(obj));
    expect(result.problemStatement).toBe('Revenue is declining.');
    expect(result.kpis).toHaveLength(1);
    expect(result.executiveSummary).toBe('Short summary.');
  });

  it('extracts problemStatement from partial JSON before closing brace', () => {
    const partial = '{"problemStatement": "Core costs are rising.", "kpis": [';
    const result = parsePartialAnalysis(partial);
    expect(result).not.toBeNull();
    expect(result.problemStatement).toBe('Core costs are rising.');
  });

  it('extracts a complete kpis array from partial JSON', () => {
    const partial = `{
      "problemStatement": "Test",
      "kpis": [
        {"name": "Revenue", "value": "$1M", "benchmark": "$1.2M", "status": "warning", "delta": "-16.7%"}
      ],
      "issueTree": {`;
    const result = parsePartialAnalysis(partial);
    expect(result.kpis).toHaveLength(1);
    expect(result.kpis[0].name).toBe('Revenue');
  });

  it('returns null for empty string', () => {
    expect(parsePartialAnalysis('')).toBeNull();
  });

  it('returns null for an opening brace with no recognisable fields', () => {
    expect(parsePartialAnalysis('{')).toBeNull();
  });

  it('strips markdown code fences before parsing', () => {
    const wrapped = '```json\n{"problemStatement": "Clean parse."}\n```';
    const result = parsePartialAnalysis(wrapped);
    expect(result).not.toBeNull();
    expect(result.problemStatement).toBe('Clean parse.');
  });

  it('extracts executiveSummary string field', () => {
    const json = JSON.stringify({
      executiveSummary: 'Strong performance across all regions.',
    });
    const result = parsePartialAnalysis(json);
    expect(result.executiveSummary).toBe('Strong performance across all regions.');
  });

  it('extracts recommendations array', () => {
    const json = JSON.stringify({
      recommendations: [
        { title: 'Cut costs', impact: 'high', situation: 'S', complication: 'C', resolution: 'R', metric: '10%' },
      ],
    });
    const result = parsePartialAnalysis(json);
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].title).toBe('Cut costs');
  });

  it('extracts swot object', () => {
    const json = JSON.stringify({
      swot: {
        strengths: ['Strong brand'],
        weaknesses: ['High cost'],
        opportunities: ['New market'],
        threats: ['Competitor X'],
      },
    });
    const result = parsePartialAnalysis(json);
    expect(result.swot.strengths).toContain('Strong brand');
    expect(result.swot.threats).toContain('Competitor X');
  });

  it('handles escaped quotes inside string fields without breaking', () => {
    const json = JSON.stringify({ problemStatement: 'Company\'s core issue is "pricing".' });
    const result = parsePartialAnalysis(json);
    expect(result).not.toBeNull();
  });

  it('returns null when input is malformed and contains no recognisable field patterns', () => {
    // Random text with no "key": value patterns matching the schema.
    expect(parsePartialAnalysis('not json at all!!!')).toBeNull();
    // Completely empty object — JSON.parse succeeds but result has no useful keys.
    // parsePartialAnalysis returns the raw parsed value in this case; the caller
    // is responsible for checking that the result is non-trivial.
    // We just verify the function does NOT throw.
    expect(() => parsePartialAnalysis('{}')).not.toThrow();
  });
});
