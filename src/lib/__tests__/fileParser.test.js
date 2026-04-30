import { describe, it, expect } from 'vitest';
import { parseText } from '../fileParser';

describe('parseText', () => {
  it('parses CSV text into columns and rows', () => {
    const csv = 'name,revenue,date\nAcme,1000,2024-01-01\nGlobex,2000,2024-02-01';
    const result = parseText(csv);
    expect(result.columns).toEqual(['name', 'revenue', 'date']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].name).toBe('Acme');
    expect(result.rows[0].revenue).toBe(1000);
  });

  it('handles empty input gracefully', () => {
    const result = parseText('');
    expect(result.columns).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it('applies dynamic typing to numeric columns', () => {
    const csv = 'id,score\n1,95.5\n2,80.0';
    const result = parseText(csv);
    expect(typeof result.rows[0].score).toBe('number');
    expect(result.rows[0].score).toBe(95.5);
  });

  it('skips empty lines', () => {
    const csv = 'a,b\n1,2\n\n3,4\n';
    const result = parseText(csv);
    expect(result.rows).toHaveLength(2);
  });
});
