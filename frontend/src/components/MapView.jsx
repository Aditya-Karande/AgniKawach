import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import { bandColor, BAND_ORDER } from '../riskTheme'

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

function boundaryStyle({ feature, wards, riskByWard, selectedWardId, theme }) {
  const ward = wards.find((candidate) => matchesWard(feature, candidate.id))
  const risk = ward ? riskByWard[ward.id] : null
  const band = risk?.risk?.band ?? null
  const selected = ward?.id === selectedWardId

  const neutralFill = theme === 'dark' ? '#273442' : '#E5E0D5'
  const neutralLine = theme === 'dark' ? '#607083' : '#AAA294'
  const selectedOutline = theme === 'dark' ? '#F4EBDD' : '#1E2126'

  return {
    color: selected ? selectedOutline : neutralLine,
    weight: selected ? 3 : 1,
    opacity: selected ? 1 : 0.8,
    fillColor: band ? bandColor(band) : neutralFill,
    fillOpacity: band ? (selected ? 0.82 : 0.62) : 0.16,
    lineCap: 'round',
    lineJoin: 'round',
  }
}

export default function MapView({ wards, riskByWard, selectedWardId, onSelect, theme = 'dark' }) {
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
      .then((data) => {
        if (!cancelled) setWardGeoJson(data)
      })
      .catch((error) => {
        if (!cancelled) setGeoJsonError(error.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const riskKey = useMemo(
    () =>
      Object.entries(riskByWard)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, value]) => `${id}:${value?.risk?.band ?? ''}:${value?.risk?.score ?? ''}`)
        .join('|'),
    [riskByWard]
  )
  const featureKey = `${theme}-${selectedWardId ?? 'none'}-${riskKey}`

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={MUMBAI_CENTER}
        zoom={11}
        scrollWheelZoom
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          key={theme}
          attribution='Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'
          url={
            theme === 'dark'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
              : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
          }
        />

        <FlyToWard ward={selectedWard} />

        {wardGeoJson && (
          <GeoJSON
            key={featureKey}
            data={wardGeoJson}
            style={(feature) =>
              boundaryStyle({ feature, wards, riskByWard, selectedWardId, theme })
            }
            onEachFeature={(feature, layer) => {
              const ward = wards.find((candidate) => matchesWard(feature, candidate.id))
              if (!ward) return

              const risk = riskByWard[ward.id]
              const band = risk?.risk?.band ?? 'Low'
              const selected = ward.id === selectedWardId

              layer.on({
                click: () => onSelect(ward.id),
                mouseover: () => {
                  layer.setStyle({
                    weight: selected ? 4 : 2.5,
                    fillOpacity: risk ? 0.82 : 0.3,
                  })
                  layer.bringToFront()
                },
                mouseout: () => {
                  layer.setStyle(
                    boundaryStyle({ feature, wards, riskByWard, selectedWardId, theme })
                  )
                },
              })

              layer.bindTooltip(
                `<div class="font-body"><div class="font-semibold">${ward.name}</div>${
                  risk
                    ? `<div>${band} · risk ${risk.risk.score.toFixed(2)} · WBGT ${risk.hazard.wbgt}°C</div>`
                    : '<div>Loading…</div>'
                }</div>`,
                { direction: 'top', opacity: 0.95, sticky: true }
              )
            }}
          />
        )}
      </MapContainer>

      <div className="absolute top-4 right-4 bg-base-900/90 border border-base-600 rounded px-3 py-2 backdrop-blur-sm z-[1000] text-[10px] text-sand/50">
        {wardGeoJson ? 'WARD RISK · GIS CHOROPLETH' : geoJsonError ? 'WARD BOUNDARIES UNAVAILABLE' : 'LOADING WARD BOUNDARIES…'}
      </div>

      <div className="absolute bottom-4 left-4 bg-base-900/90 border border-base-600 rounded px-3 py-2 backdrop-blur-sm z-[1000]">
        <div className="text-[10px] tracking-wide text-sand/50 mb-1.5 font-display">
          RISK BAND
        </div>
        <div className="flex flex-col gap-1">
          {BAND_ORDER.map((band) => (
            <div key={band} className="flex items-center gap-2 text-xs text-sand/80">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: bandColor(band) }}
              />
              {band}
            </div>
          ))}
          <div className="flex items-center gap-2 text-xs text-sand/50 mt-0.5 pt-1 border-t border-base-600">
            <span
              className="w-2.5 h-2.5 rounded-sm border"
              style={{
                backgroundColor: theme === 'dark' ? '#273442' : '#E5E0D5',
                borderColor: theme === 'dark' ? '#607083' : '#AAA294',
              }}
            />
            No risk data
          </div>
        </div>
      </div>
    </div>
  )
}
