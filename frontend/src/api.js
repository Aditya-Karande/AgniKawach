// Thin fetch wrappers to the FastAPI backend. Vite dev server proxies
// /api -> http://127.0.0.1:8000 (see vite.config.js), so these paths
// work unchanged in dev.

async function getJSON(path) {
  const res = await fetch(path)
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${path} -> ${res.status} ${body}`)
  }
  return res.json()
}

export function getWards() {
  return getJSON('/api/wards')
}

export function getForecast(wardId) {
  return getJSON(`/api/forecast/${wardId}`)
}

export function getRisk(wardId, day) {
  return getJSON(`/api/risk/${wardId}?day=${day}`)
}

export function getRiskAll(day) {
  return getJSON(`/api/risk-all?day=${day}`)
}

export function getAlert(wardId, day, audience) {
  return getJSON(`/api/alert/${wardId}?day=${day}&audience=${audience}`)
}

export function getHealth() {
  return getJSON('/api/health')
}
