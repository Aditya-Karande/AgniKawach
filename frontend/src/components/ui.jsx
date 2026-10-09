import { useState } from 'react'
import { bandColor, BAND_BG } from '../riskTheme'

const ICONS = {
  overview: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>,
  ward: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  why: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  forecast: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  alerts: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  vulnerability: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  data: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></>,
  chevron: <polyline points="9 18 15 12 9 6" />,
  sun: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  pin: <><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
}

export function Icon({ name, className = 'w-[18px] h-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[name]}
    </svg>
  )
}

export function RiskBadge({ band, className = '' }) {
  if (!band) return <span className="text-[11px] text-sand/40">NO DATA</span>
  const c = bandColor(band)
  return (
    <span
      className={`inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${className}`}
      style={{ color: c, background: BAND_BG[band], border: `1px solid ${c}40` }}
    >
      {band.toUpperCase()}
    </span>
  )
}

export function Card({ title, subtitle, right, children, className = '', pad = true }) {
  return (
    <section className={`bg-base-900 border border-base-600 rounded-lg ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div>
            <h3 className="text-[13px] font-semibold text-sand">{title}</h3>
            {subtitle && <p className="text-[11px] text-sand/50 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={pad ? 'px-4 pb-4 pt-1' : ''}>{children}</div>
    </section>
  )
}

export function Kpi({ label, value, sub, color, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className="text-left bg-base-900 border border-base-600 rounded-lg px-4 py-3.5 hover:border-sand/30 transition-colors disabled:cursor-default">
      <div className="text-[11px] font-medium text-sand/55 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1 leading-tight" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[11px] text-sand/50 mt-1">{sub}</div>}
    </Tag>
  )
}

export function Bar({ label, value, max = 1, color = '#1F4E8C', right, hint }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div title={hint}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-sand/75">{label}</span>
        <span className="font-mono text-sand/70">{right}</span>
      </div>
      <div className="h-2 rounded-full bg-base-700 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function Collapsible({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-base-600 rounded-lg bg-base-900">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-sand">
        {title}
        <Icon name="chevron" className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function Empty({ text = 'Loading…' }) {
  return <div className="text-sm text-sand/45 py-8 text-center">{text}</div>
}

export function NextStep({ label, onClick }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-sand dark:text-base-950 rounded-md px-4 py-2 hover:opacity-90">
      {label} <span aria-hidden>→</span>
    </button>
  )
}

export function dataStatus(source, value) {
  if (value == null || /^not found/i.test(source ?? '')) return 'unavailable'
  return /^verified/i.test(source ?? '') ? 'verified' : 'estimated'
}

const STATUS_STYLE = {
  verified: 'bg-risk-low/10 text-risk-low border-risk-low/30',
  estimated: 'bg-risk-moderate/10 text-[#8A6414] dark:text-risk-moderate border-risk-moderate/30',
  available: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  unavailable: 'bg-sand/5 text-sand/50 border-sand/20',
  planned: 'bg-sand/5 text-sand/55 border-sand/20',
  live: 'bg-risk-low/10 text-risk-low border-risk-low/30',
}
export function StatusBadge({ status, title }) {
  return (
    <span title={title} className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${STATUS_STYLE[status] ?? STATUS_STYLE.unavailable}`}>
      {status}
    </span>
  )
}

export const FIELD_LABEL = {
  population: 'Population',
  density_per_km2: 'Population density',
  elderly_pct: 'Elderly population',
  outdoor_worker_pct: 'Outdoor workers',
  green_cover_pct: 'Green cover',
  informal_housing_pct: 'Informal housing',
}
export const FIELD_UNIT = { density_per_km2: '/km²', elderly_pct: '%', outdoor_worker_pct: '%', green_cover_pct: '%', informal_housing_pct: '%' }
export const fmtField = (f, v) => (v == null ? 'No data' : `${Number(v).toLocaleString()}${FIELD_UNIT[f] ?? ''}`)

export function VulnerabilityBars({ components, dominantField }) {
  const sorted = [...components].sort((a, b) => b.contribution - a.contribution)
  return (
    <div className="space-y-3">
      {sorted.map((c) => (
        <Bar
          key={c.field}
          label={FIELD_LABEL[c.field] ?? c.label}
          value={c.normalized}
          right={fmtField(c.field, c.raw_value)}
          color={c.field === dominantField ? '#D9672E' : '#1F4E8C'}
          hint={`Normalised ${c.normalized} × weight ${c.weight} = contribution ${c.contribution}`}
        />
      ))}
      <p className="text-[11px] text-sand/45">Bar = how high this ward ranks across Mumbai wards (0–1). Orange marks the biggest driver.</p>
    </div>
  )
}

export function WardTable({ riskByWard, wardsById, limit, selectedWardId, onSelect, showVuln = false }) {
  const rows = Object.values(riskByWard).sort((a, b) => b.risk.score - a.risk.score).slice(0, limit ?? 99)
  if (!rows.length) return <Empty text="Loading ward risk…" />
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] uppercase tracking-wide text-sand/45 text-left">
          <th className="font-medium py-1 w-6">#</th>
          <th className="font-medium">Ward</th>
          <th className="font-medium">Heat stress</th>
          {showVuln && <th className="font-medium">Vuln.</th>}
          <th className="font-medium">Risk</th>
          <th className="font-medium text-right">Band</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const w = wardsById[r.ward_id]
          if (!w) return null
          return (
            <tr
              key={r.ward_id}
              onClick={() => onSelect?.(r.ward_id)}
              className={`border-t border-base-700 cursor-pointer hover:bg-base-800 ${r.ward_id === selectedWardId ? 'bg-base-800' : ''}`}
            >
              <td className="py-2.5 font-mono text-xs text-sand/45">{i + 1}</td>
              <td className="font-medium">{w.name.split(' (')[0]}</td>
              <td className="font-mono text-xs">{r.hazard.wbgt}°C</td>
              {showVuln && <td className="font-mono text-xs">{r.vulnerability.score.toFixed(2)}</td>}
              <td className="font-mono text-xs font-semibold" style={{ color: bandColor(r.risk.band) }}>{r.risk.score.toFixed(2)}</td>
              <td className="text-right"><RiskBadge band={r.risk.band} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
