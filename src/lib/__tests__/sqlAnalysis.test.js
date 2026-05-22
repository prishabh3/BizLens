import { describe, it, expect } from 'vitest';
import { isNumericColumn, isDateColumn } from '../sqlAnalysis';

// ─── isNumericColumn ────────────────────────────────────────────────────────

describe('isNumericColumn', () => {
  it('returns true for a column of JS numbers', () => {
    const rows = [{ revenue: 100 }, { revenue: 200 }, { revenue: 300 }];
    expect(isNumericColumn('revenue', rows)).toBe(true);
  });

  it('returns true for a column of numeric strings', () => {
    const rows = [{ score: '95.5' }, { score: '80' }, { score: '72.1' }];
    expect(isNumericColumn('score', rows)).toBe(true);
  });

  it('returns false when any value is non-numeric', () => {
    const rows = [{ col: 1 }, { col: 'N/A' }, { col: 3 }];
    expect(isNumericColumn('col', rows)).toBe(false);
  });

  it('returns false when all values are null or empty', () => {
    const rows = [{ col: null }, { col: undefined }, { col: '' }];
    expect(isNumericColumn('col', rows)).toBe(false);
  });

  it('returns true when nulls are mixed with valid numbers (nulls are filtered out)', () => {
    const rows = [{ val: null }, { val: 42 }, { val: 18 }];
    expect(isNumericColumn('val', rows)).toBe(true);
  });

  it('handles zero correctly (should be numeric)', () => {
    const rows = [{ count: 0 }, { count: 5 }, { count: 10 }];
    expect(isNumericColumn('count', rows)).toBe(true);
  });

  it('returns false for empty row array', () => {
    expect(isNumericColumn('col', [])).toBe(false);
  });
});

// ─── isDateColumn ────────────────────────────────────────────────────────────

describe('isDateColumn', () => {
  it('detects ISO 8601 dates', () => {
    const rows = [
      { date: '2024-01-15' },
      { date: '2024-02-28' },
      { date: '2023-12-01' },
    ];
    expect(isDateColumn('date', rows)).toBe(true);
  });

  it('detects MM/DD/YYYY format', () => {
    const rows = [
      { date: '01/15/2024' },
      { date: '12/31/2023' },
      { date: '06/01/2024' },
    ];
    expect(isDateColumn('date', rows)).toBe(true);
  });

  it('detects quarter format (2023Q1)', () => {
    const rows = [
      { period: '2023Q1' },
      { period: '2023Q2' },
      { period: '2023Q3' },
      { period: '2023Q4' },
    ];
    expect(isDateColumn('period', rows)).toBe(true);
  });

  it('detects year-month format (2023-01)', () => {
    const rows = [
      { month: '2023-01' },
      { month: '2023-02' },
      { month: '2023-03' },
    ];
    expect(isDateColumn('month', rows)).toBe(true);
  });

  it('returns false for plain text values', () => {
    const rows = [
      { category: 'Healthcare' },
      { category: 'Finance' },
      { category: 'Retail' },
    ];
    expect(isDateColumn('category', rows)).toBe(false);
  });

  it('returns false for numeric values (numbers are filtered out as non-string)', () => {
    const rows = [{ val: 2024 }, { val: 2023 }, { val: 2022 }];
    expect(isDateColumn('val', rows)).toBe(false);
  });

  it('returns false when all values are null/empty', () => {
    const rows = [{ date: null }, { date: undefined }, { date: '' }];
    expect(isDateColumn('date', rows)).toBe(false);
  });

  it('returns true when ≥80% of values match — tolerates a few bad rows', () => {
    const rows = [
      { date: '2024-01-01' },
      { date: '2024-02-01' },
      { date: '2024-03-01' },
      { date: '2024-04-01' },
      { date: 'not-a-date' },   // 1 of 5 = 20% fail → 80% match → passes
    ];
    expect(isDateColumn('date', rows)).toBe(true);
  });

  it('returns false when <80% of values match', () => {
    const rows = [
      { date: '2024-01-01' },
      { date: 'bad' },
      { date: 'bad' },
      { date: 'bad' },          // 3 of 4 fail → 25% match → fails
    ];
    expect(isDateColumn('date', rows)).toBe(false);
  });

  it('returns false for empty row array', () => {
    expect(isDateColumn('date', [])).toBe(false);
  });
});
