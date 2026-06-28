const PREFIX = 'fes_kintai_'

export function save(key, data) {
  localStorage.setItem(PREFIX + key, JSON.stringify(data))
}

export function load(key, fallback = null) {
  const raw = localStorage.getItem(PREFIX + key)
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key)
}

export function saveSession(token) {
  sessionStorage.setItem(PREFIX + 'session', token)
}

export function loadSession() {
  return sessionStorage.getItem(PREFIX + 'session')
}

export function clearSession() {
  sessionStorage.removeItem(PREFIX + 'session')
}
