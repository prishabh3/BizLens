export interface SharePayload {
  analysisResult: Record<string, unknown>;
  sector: string;
  savedAt: number;
  profileSummary: ProfileSummary | null;
}

export interface ProfileSummary {
  rowCount: number;
  columnCount: number;
  kpiColumns: string[];
  dateColumns: string[];
  anomalies: unknown[];
  timeSeries?: unknown;
}

const SHARE_PREFIX = 'share=';

export function encodeSharePayload(
  analysisResult: Record<string, unknown>,
  dataProfile: Record<string, unknown> | null,
  sector: string
): string | null {
  try {
    const payload: SharePayload = {
      analysisResult,
      sector,
      savedAt: Date.now(),
      profileSummary: dataProfile ? {
        rowCount: dataProfile.rowCount as number,
        columnCount: dataProfile.columnCount as number,
        kpiColumns: (dataProfile.kpiColumns as string[]) ?? [],
        dateColumns: (dataProfile.dateColumns as string[]) ?? [],
        anomalies: ((dataProfile.anomalies as unknown[]) ?? []).slice(0, 3),
        timeSeries: dataProfile.timeSeries,
      } : null,
    };
    const json = JSON.stringify(payload);
    return btoa(encodeURIComponent(json));
  } catch {
    return null;
  }
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

export function buildShareUrl(encoded: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${SHARE_PREFIX}${encoded}`;
}

export function extractShareFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash.startsWith(`#${SHARE_PREFIX}`)) return null;
  return hash.slice(SHARE_PREFIX.length + 1);
}

export function clearShareFromUrl(): void {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
