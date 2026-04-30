import { describe, it, expect } from 'vitest';
import { encodeSharePayload, decodeSharePayload } from '../sharing';

const MOCK_RESULT = {
  problemStatement: 'Revenue is declining.',
  kpis: [{ name: 'Revenue', value: '$1M', benchmark: '$1.2M', status: 'warning', delta: '-16.7%' }],
  executiveSummary: 'Overview here.',
};

const MOCK_PROFILE = {
  rowCount: 500,
  columnCount: 8,
  kpiColumns: ['revenue'],
  dateColumns: ['date'],
  anomalies: [],
};

describe('sharing — encode/decode round-trip', () => {
  it('encodes and decodes without data loss', () => {
    const encoded = encodeSharePayload(MOCK_RESULT, MOCK_PROFILE, 'Healthcare / SHaPE');
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeSharePayload(encoded);
    expect(decoded.analysisResult.problemStatement).toBe(MOCK_RESULT.problemStatement);
    expect(decoded.analysisResult.kpis[0].name).toBe('Revenue');
    expect(decoded.sector).toBe('Healthcare / SHaPE');
    expect(decoded.profileSummary.rowCount).toBe(500);
  });

  it('returns null for corrupted input', () => {
    expect(decodeSharePayload('not-valid-base64!!!')).toBeNull();
    expect(decodeSharePayload('')).toBeNull();
  });

  it('encodes large payloads without throwing', () => {
    const bigResult = {
      ...MOCK_RESULT,
      recommendations: Array.from({ length: 10 }, (_, i) => ({
        title: `Recommendation ${i}`,
        impact: 'high',
        situation: 'A'.repeat(200),
        complication: 'B'.repeat(200),
        resolution: 'C'.repeat(200),
        metric: '10% improvement',
      })),
    };
    const encoded = encodeSharePayload(bigResult, MOCK_PROFILE, 'General Business');
    expect(encoded).not.toBeNull();
    const decoded = decodeSharePayload(encoded);
    expect(decoded.analysisResult.recommendations).toHaveLength(10);
  });
});
