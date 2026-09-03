// Single source of truth for risk-band colour + ordering, shared by the
// map, ward list, and legend so they never drift out of sync.

export const BAND_ORDER = ['Extreme', 'High', 'Moderate', 'Low']

export const BAND_COLOR = {
  Extreme: '#C23B3B',
  High: '#D9672E',
  Moderate: '#D9A441',
  Low: '#4A9B7F',
}

export const BAND_RADIUS = {
  Extreme: 16,
  High: 13,
  Moderate: 10,
  Low: 8,
}

export function bandColor(band) {
  return BAND_COLOR[band] ?? '#7A8699'
}
