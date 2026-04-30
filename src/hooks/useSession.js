const SESSION_KEY = 'bizlens_session';

export function loadCachedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(data) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
