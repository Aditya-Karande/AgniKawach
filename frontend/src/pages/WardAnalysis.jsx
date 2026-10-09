import { Card, RiskBadge, Bar, Collapsible, StatusBadge, VulnerabilityBars, Empty, NextStep, dataStatus, FIELD_LABEL, fmtField } from '../components/ui'
import { bandColor, shortName } from '../riskTheme'

function Stat({ label, value, sub }) {
  return (
    <div className="bg-base-800 rounded-md px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-sand/50">{label}</div>
      <div className="text-lg font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-sand/45">{sub}</div>}
    </div>
  )
}

export default function WardAnalysis({ ctx }) {
  const { selectedWard: w, selectedRisk: r, selectedForecast: f, navigate } = ctx
  if (!w || !r) return <Empty text="Select a ward on the Risk Map to see its analysis." />
  const c = bandColor(r.risk.band)
  const hz = r.hazard.score, vs = r.vulnerability.score

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="bg-base-900 border border-base-600 rounded-lg p-5" style={{ borderLeft: `4px solid ${c}` }}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{shortName(w.name)} — Ward heat risk analysis</h2>
          <RiskBadge band={r.risk.band} />
        </div>
        <p className="text-xs text-sand/50 mt-0.5">{w.name} · {r.date}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Stat label="Overall heat risk" value={<span style={{ color: c }}>{r.risk.score.toFixed(2)}</span>} sub="0 – 1 scale" />
          <Stat label="Heat stress" value={`${r.hazard.wbgt}°C`} sub="WBGT" />
          <Stat label="Community vulnerability" value={vs.toFixed(2)} sub={`Top driver: ${r.vulnerability.dominant_driver}`} />
          <Stat label="Forecast" value={f ? `${f.temp_c}°C` : '—'} sub={f ? `${f.rh_pct}% RH · ${f.source}` : 'Unavailable'} />
        </div>
      </div>

      {/* hazard + vulnerability -> risk */}
      <Card title="How the risk is built" subtitle="Heat stress and community vulnerability are weighted equally">
        <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4 text-center">
          <div className="flex-1 border border-base-600 rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wide text-sand/50">Heat stress</div>
            <div className="text-2xl font-semibold mt-1">{r.hazard.wbgt}°C</div>
            <div className="text-[11px] text-sand/50">WBGT · hazard score {hz.toFixed(2)}</div>
          </div>
          <div className="self-center text-2xl text-sand/40">+</div>
          <div className="flex-1 border border-base-600 rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wide text-sand/50">Community vulnerability</div>
            <div className="text-2xl font-semibold mt-1">{vs.toFixed(2)}</div>
            <div className="text-[11px] text-sand/50">{r.vulnerability.dominant_driver}</div>
          </div>
          <div className="self-center text-2xl text-sand/40"><span className="hidden md:inline">→</span><span className="md:hidden">↓</span></div>
          <div className="flex-1 rounded-lg p-4" style={{ border: `2px solid ${c}` }}>
            <div className="text-[10px] uppercase tracking-wide text-sand/50">Overall heat risk</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: c }}>{r.risk.score.toFixed(2)}</div>
            <div className="text-[11px] font-bold" style={{ color: c }}>{r.risk.band.toUpperCase()}</div>
          </div>
        </div>
        {/* composition */}
        <div className="mt-5">
          <div className="text-[11px] text-sand/55 mb-1.5">Risk composition (0.5 × heat stress + 0.5 × vulnerability)</div>
          <div className="flex h-6 rounded-md overflow-hidden bg-base-700">
            <div style={{ width: `${hz * 50}%`, background: '#D9672E' }} className="flex items-center justify-center text-[10px] font-semibold text-white" title="Heat stress contribution">{(hz * 0.5).toFixed(2)}</div>
            <div style={{ width: `${vs * 50}%`, background: '#1F4E8C' }} className="flex items-center justify-center text-[10px] font-semibold text-white" title="Vulnerability contribution">{(vs * 0.5).toFixed(2)}</div>
          </div>
          <div className="flex gap-4 text-[11px] text-sand/60 mt-1.5">
            <span><i className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#D9672E' }} />Heat stress</span>
            <span><i className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#1F4E8C' }} />Vulnerability</span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Heat stress" subtitle="WBGT estimates the environmental heat stress people actually experience — not just air temperature.">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="WBGT (heat stress)" value={`${r.hazard.wbgt}°C`} />
            <Stat label="Local temperature" value={`${r.hazard.local_temp_c}°C`} sub={`${r.hazard.uhi_offset_c >= 0 ? '+' : ''}${r.hazard.uhi_offset_c}°C local adjustment`} />
            <Stat label="Forecast temperature" value={f ? `${f.temp_c}°C` : '—'} />
            <Stat label="Humidity" value={f ? `${f.rh_pct}%` : '—'} />
            {f?.wind_kmh != null && <Stat label="Wind" value={`${f.wind_kmh} km/h`} />}
          </div>
          <div className="mt-4"><Bar label="Heat-stress hazard score" value={hz} right={hz.toFixed(2)} color="#D9672E" hint="Scaled 0–1 over the 20–34°C WBGT band" /></div>
        </Card>
        <Card title="Community vulnerability" subtitle="Who in this ward is most exposed">
          <VulnerabilityBars components={r.vulnerability.components} dominantField={r.vulnerability.dominant_driver_field} />
        </Card>
      </div>

      <Collapsible title="Data provenance">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {Object.entries(w.sources || {}).map(([field, src]) => {
            const st = dataStatus(src, w[field])
            return (
              <div key={field} className="flex items-center justify-between gap-2 py-1 border-b border-base-700" title={src}>
                <span className="text-sand/65">{FIELD_LABEL[field] ?? field}</span>
                <span className="flex items-center gap-2"><span className="font-mono">{fmtField(field, w[field])}</span><StatusBadge status={st} title={src} /></span>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-sand/45 mt-2">Hover a badge to read the cited source. Full source list under Data &amp; Insights.</p>
      </Collapsible>

      <NextStep label="Why is this risk high?" onClick={() => navigate('why')} />
    </div>
  )
}
