import { describe, it, expect } from 'vitest';
import { getBenchmarksForSector, formatBenchmarksForPrompt, SECTOR_BENCHMARKS } from '../benchmarks';

describe('getBenchmarksForSector', () => {
  it('returns benchmarks for known sectors', () => {
    const benchmarks = getBenchmarksForSector('Healthcare / SHaPE');
    expect(typeof benchmarks).toBe('object');
    expect(Object.keys(benchmarks).length).toBeGreaterThan(0);
  });

  it('falls back to General Business for unknown sectors', () => {
    const result = getBenchmarksForSector('Unknown Sector XYZ');
    const general = getBenchmarksForSector('General Business');
    expect(result).toEqual(general);
  });

  it('covers all 6 defined sectors', () => {
    const sectors = Object.keys(SECTOR_BENCHMARKS);
    expect(sectors).toHaveLength(6);
    expect(sectors).toContain('Healthcare / SHaPE');
    expect(sectors).toContain('Financial Services');
    expect(sectors).toContain('General Business');
  });
});

describe('formatBenchmarksForPrompt', () => {
  it('returns a non-empty string', () => {
    const formatted = formatBenchmarksForPrompt('Retail & Consumer Goods');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(10);
  });

  it('includes metric names and values', () => {
    const formatted = formatBenchmarksForPrompt('Financial Services');
    expect(formatted).toContain('return on equity');
    expect(formatted).toContain('10-12%');
  });
});
