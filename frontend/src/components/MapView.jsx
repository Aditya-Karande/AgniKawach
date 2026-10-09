import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import { bandColor, BAND_ORDER, shortName } from '../riskTheme'

const MUMBAI_CENTER = [19.05, 72.88]

// Public Mumbai BMC administrative-ward boundaries.
// The project already depends on online Leaflet tiles, so loading this
// GeoJSON at runtime keeps the bundle smaller and makes the boundary data
// easy to replace with an official/local copy later.
const WARD_GEOJSON_URL =
  import.meta.env.VITE_WARD_GEOJSON_URL ||
  'https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Mumbai/BMC_Wards.geojson'

const WARD_CODE_ALIASES = {
  'm-east': ['m/e', 'm-east', 'meast', 'm east'],
  l: ['l', 'l ward'],
  'g-north': ['g/n', 'g-north', 'gnorth', 'g north'],
  'f-north': ['f/n', 'f-north', 'fnorth', 'f north'],
  'k-west': ['k/w', 'k-west', 'kwest', 'k west'],
  'p-north': ['p/n', 'p-north', 'pnorth', 'p north'],
  'h-west': ['h/w', 'h-west', 'hwest', 'h west'],
  a: ['a', 'a ward'],
}

function normalizeWardCode(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
}

function getFeatureWardCode(feature) {
  const props = feature?.properties ?? {}
  const candidate =
    props.NAME ??
    props.name ??
    props.WARD ??
    props.ward ??
    props.WARD_NAME ??
    props.ward_name ??
    props.WARDNO ??
    props.ward_no ??
    props.CODE ??
    props.code

  return normalizeWardCode(candidate)
}

function matchesWard(feature, wardId) {
  const featureCode = getFeatureWardCode(feature)
  const aliases = WARD_CODE_ALIASES[wardId] ?? [wardId]
  if (aliases.includes(featureCode)) return true

  // Some boundary datasets include the ward code inside a longer label,
  // e.g. "M/E (Mankhurd)". Match that prefix without confusing A/B/C…
  // with longer ward names.
  return aliases.some((alias) => {
    if (alias.length <= 1) return featureCode.startsWith(`${alias} `)
    return featureCode.startsWith(`${alias} `) || featureCode.startsWith(`${alias}(`)
  })
}

function FlyToWard({ ward }) {
  const map = useMap()
  useEffect(() => {
    if (ward) {
      map.flyTo([ward.lat, ward.lon], 12, { duration: 0.6 })
    }
  }, [ward, map])
  return null
}

// Map layers. "risk" uses the semantic risk-band colours; every other layer
// is a single-hue sequential ramp so it can never be mistaken for risk.
export const LAYERS = [
  { id: 'risk', label: 'Overall risk' },
  { id: 'heat', label: 'Heat stress' },
  { id: 'vuln', label: 'Vulnerability' },
  { id: 'population', label: 'Population' },
  { id: 'green', label: 'Green cover' },
]
const RAMPS = {
  heat: ['#FBEBD3', '#B5471E'],
  green: ['#E3F1E8', '#2F7D5B'],
  default: ['#E1EBF7', '#1F4E8C'],
}
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
function ramp(kind, t) {
  const [a, b] = (RAMPS[kind] ?? RAMPS.default).map(hex)
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`
}
export function layerValue(layer, ward, risk) {
  if (!ward) return null
  switch (layer) {
    case 'heat': return risk?.hazard?.wbgt ?? null
    case 'vuln': return risk?.vulnerability?.score ?? null
    case 'population': return ward.population ?? null
    case 'green': return ward.green_cover_pct ?? null
    case 'risk': return null
    default: return ward[layer] ?? null // raw ward field e.g. informal_housing_pct
  }
}
const rampKind = (layer) => (layer === 'heat' ? 'heat' : layer === 'green' ? 'green' : 'default')

function boundaryStyle({ feature, wards, riskByWard, selectedWardId, theme, layer, range }) {
  const ward = wards.find((candidate) => matchesWard(feature, candidate.id))
  const risk = ward ? riskByWard[ward.id] : null
  const selected = ward?.id === selectedWardId
  const neutralFill = theme === 'dark' ? '#273442' : '#DDE3EA'
  const neutralLine = theme === 'dark' ? '#607083' : '#9AA5B4'
  const selectedOutline = theme === 'dark' ? '#F4F7FB' : '#111B2D'

  let fill = null
  if (layer === 'risk') {
    fill = risk ? bandColor(risk.risk.band) : null
  } else {
    const v = layerValue(layer, ward, risk)
    if (v != null && range) {
      const t = range.max === range.min ? 0.5 : (v - range.min) / (range.max - range.min)
      fill = ramp(rampKind(layer), Math.max(0, Math.min(1, t)))
    }
  }
  return {
    color: selected ? selectedOutline : neutralLine,
    weight: selected ? 3 : 1,
    opacity: selected ? 1 : 0.8,
    fillColor: fill ?? neutralFill,
    fillOpacity: fill ? (selected ? 0.85 : 0.68) : 0.2,
    lineJoin: 'round',
  }
}

export function MapLegend({ layer, range, theme }) {
  const box = 'absolute bottom-4 left-4 bg-base-900/95 border border-base-600 rounded-md px-3 py-2 z-[1000]'
  const noData = (
    <div className="flex items-center gap-2 text-xs text-sand/60 mt-1 pt-1 border-t border-base-600">
      <span className="w-2.5 h-2.5 rounded-sm border" style={{ backgroundColor: theme === 'dark' ? '#273442' : '#DDE3EA', borderColor: '#9AA5B4' }} />
      No data
    </div>
  )
  if (layer === 'risk') {
    return (
      <div className={box}>
        <div className="text-[10px] tracking-wide text-sand/50 mb-1.5 font-semibold">RISK BAND</div>
        {BAND_ORDER.map((band) => (
          <div key={band} className="flex items-center gap-2 text-xs text-sand/80 mb-0.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: bandColor(band) }} />
            {band.toUpperCase()}
          </div>
        ))}
        {noData}
      </div>
    )
  }
  const kind = rampKind(layer)
  return (
    <div className={box}>
      <div className="text-[10px] tracking-wide text-sand/50 mb-1.5 font-semibold">
        {(LAYERS.find((l) => l.id === layer)?.label ?? layer).toUpperCase()}
      </div>
      <div className="h-2 w-36 rounded-sm" style={{ background: `linear-gradient(90deg, ${ramp(kind, 0)}, ${ramp(kind, 1)})` }} />
      <div className="flex justify-between text-[10px] font-mono text-sand/60 mt-0.5">
        <span>{range ? Math.round(range.min * 100) / 100 : '–'}</span>
        <span>{range ? Math.round(range.max * 100) / 100 : '–'}</span>
      </div>
      {noData}
    </div>
  )
}

export default function MapView({
  wards, riskByWard, selectedWardId, onSelect, theme = 'light', layer = 'risk', showLegend = true, flyTo = true,
}) {
  const selectedWard = wards.find((w) => w.id === selectedWardId)
  const [wardGeoJson, setWardGeoJson] = useState(null)
  const [geoJsonError, setGeoJsonError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setGeoJsonError(null)
    fetch(WARD_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Ward boundary request failed (${response.status})`)
        return response.json()
      })
      .then((data) => !cancelled && setWardGeoJson(data))
      .catch((error) => !cancelled && setGeoJsonError(error.message))
    return () => { cancelled = true }
  }, [])

  const range = useMemo(() => {
    if (layer === 'risk') return null
    const vals = wards.map((w) => layerValue(layer, w, riskByWard[w.id])).filter((v) => v != null)
    return vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : null
  }, [layer, wards, riskByWard])

  const riskKey = useMemo(
    () => Object.entries(riskByWard).sort(([a], [b]) => a.localeCompare(b))
      .map(([id, v]) => `${id}:${v?.risk?.band ?? ''}:${v?.risk?.score ?? ''}`).join('|'),
    [riskByWard]
  )
  const featureKey = `${theme}-${layer}-${selectedWardId ?? 'none'}-${riskKey}`
  const style = (feature) => boundaryStyle({ feature, wards, riskByWard, selectedWardId, theme, layer, range })

  return (
    <div className="relative w-full h-full">
      <MapContainer center={MUMBAI_CENTER} zoom={11} scrollWheelZoom className="w-full h-full" zoomControl={false}>
        <TileLayer
          key={theme}
          attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
          url={
            theme === 'dark'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
              : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          }
        />
        {flyTo && <FlyToWard ward={selectedWard} />}
        {wardGeoJson && (
          <GeoJSON
            key={featureKey}
            data={wardGeoJson}
            style={style}
            onEachFeature={(feature, layerObj) => {
              const ward = wards.find((c) => matchesWard(feature, c.id))
              if (!ward) return
              const risk = riskByWard[ward.id]
              const lv = layerValue(layer, ward, risk)
              layerObj.on({
                click: () => onSelect(ward.id),
                mouseover: () => {
                  layerObj.setStyle({ weight: 2.5, fillOpacity: 0.88 })
                  layerObj.bringToFront()
                },
                mouseout: () => layerObj.setStyle(style(feature)),
              })
              layerObj.bindTooltip(
                `<div><div style="font-weight:600">${shortName(ward.name)}</div>${
                  risk
                    ? `<div>${risk.risk.band} risk · ${risk.risk.score.toFixed(2)}</div><div>WBGT ${risk.hazard.wbgt}°C · Vulnerability ${risk.vulnerability.score.toFixed(2)}</div>${
                        layer !== 'risk' && !['heat', 'vuln'].includes(layer) ? `<div>${layer.replace(/_/g, ' ')}: ${lv ?? 'no data'}</div>` : ''
                      }`
                    : '<div>Loading…</div>'
                }</div>`,
                { direction: 'top', opacity: 0.97, sticky: true }
              )
            }}
          />
        )}
      </MapContainer>
      {(!wardGeoJson) && (
        <div className="absolute top-4 right-4 bg-base-900/95 border border-base-600 rounded-md px-3 py-2 z-[1000] text-[11px] text-sand/60">
          {geoJsonError ? 'Ward boundaries unavailable' : 'Loading ward boundaries…'}
        </div>
      )}
      {showLegend && <MapLegend layer={layer} range={range} theme={theme} />}
    </div>
  )
}
