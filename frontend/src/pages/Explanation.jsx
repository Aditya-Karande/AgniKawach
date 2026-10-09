import { Card, RiskBadge, Collapsible, Empty, NextStep } from '../components/ui'
import { bandColor, shortName } from '../riskTheme'

const MEANING = {
  Extreme: 'Conditions are dangerous for many residents here. Heat stress is high and a large share of people have few ways to cope, so heat-related illness is likely without intervention.',
  High: 'Heat stress is significant and vulnerable groups are at real risk. Targeted advisories and preparedness are warranted.',
  Moderate: 'Conditions are uncomfortable and may affect vulnerable people. Monitor and share safety reminders.',
  Low: 'Heat stress and vulnerability together are low. Routine monitoring is enough.',
}

function Step({ n, title, value, sub, color, last }) {
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-base-600" />}
      <span className="w-8 h-8 shrink-0 rounded-full bg-base-900 border-2 flex items-center justify-center text-[11px] font-bold z-[1]" style={{ borderColor: color ?? '#8592A6', color: color ?? undefined }}>{n}</span>
      <div className="flex-1 bg-base-900 border border-base-600 rounded-lg px-4 py-3">
        <div className="text-[10px] uppercase tracking-wide text-sand/50">{title}</div>
        <div className="text-lg font-semibold leading-tight" style={color ? { color } : undefined}>{value}</div>
        {sub && <div className="text-xs text-sand/55 mt-0.5">{sub}</div>}
      </div>
    </li>
  )
}

export default function Explanation({ ctx }) {
  const { selectedWard: w, selectedRisk: r, selectedForecast: f, riskByWard, wardsById, navigate } = ctx
  if (!w || !r) return <Empty text="Select a ward to see why its risk is rated this way." />
  const c = bandColor(r.risk.band)

  // rank wards by local temperature vs by overall risk
  const all = Object.values(riskByWard)
  const byTemp = [...all].sort((a, b) => b.hazard.local_temp_c - a.hazard.local_temp_c).map((x) => x.ward_id)
  const byRisk = [...all].sort((a, b) => b.risk.score - a.risk.score).map((x) => x.ward_id)

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-5">
      <h2 className="text-xl font-semibold">Why is {shortName(w.name)} rated <span style={{ color: c }}>{r.risk.band.toUpperCase()}</span> risk?</h2>

      <div className="grid lg:grid-cols-5 gap-5">
        <ol className="lg:col-span-3">
          <Step n="01" title="Forecast" value={f ? `${f.temp_c}°C · ${f.rh_pct}% RH` : 'Unavailable'} sub={f ? `Source: ${f.source}` : undefined} />
          <Step n="02" title="Local adjustment" value={`${r.hazard.uhi_offset_c >= 0 ? '+' : ''}${r.hazard.uhi_offset_c}°C`} sub={`Density, informal housing and green cover raise local heat → ${r.hazard.local_temp_c}°C`} />
          <Step n="03" title="Heat stress (WBGT)" value={`${r.hazard.wbgt}°C`} sub={`Hazard score ${r.hazard.score.toFixed(2)} on a 0–1 scale`} color="#D9672E" />
          <Step n="04" title="Community vulnerability" value={r.vulnerability.score.toFixed(2)} sub={`Biggest driver: ${r.vulnerability.dominant_driver}`} color="#1F4E8C" />
          <Step n="05" title="Overall heat risk" value={r.risk.score.toFixed(2)} sub="0.5 × heat stress + 0.5 × vulnerability" color={c} />
          <Step n="06" title="Risk band" value={r.risk.band.toUpperCase()} color={c} last />
        </ol>

        <div className="lg:col-span-2 space-y-4">
          <Card title="What does this mean?">
            <p className="text-sm text-sand/80 leading-relaxed">{MEANING[r.risk.band]}</p>
            {r.consecutive_extreme_days >= 2 && (
              <p className="text-xs mt-3 text-sand/60">{r.consecutive_extreme_days} consecutive Extreme-risk days — sustained exposure raises the health impact.</p>
            )}
          </Card>
          <Card title="Temperature alone is not enough" subtitle="Local temperature rank vs. overall risk rank">
            <table className="w-full text-xs">
              <thead><tr className="text-[10px] uppercase text-sand/45 text-left"><th className="font-medium py-1">Ward</th><th className="font-medium">Temp rank</th><th className="font-medium">Risk rank</th></tr></thead>
              <tbody>
                {byRisk.map((id) => (
                  <tr key={id} className={`border-t border-base-700 ${id === w.id ? 'font-semibold bg-base-800' : ''}`}>
                    <td className="py-1.5">{shortName(wardsById[id]?.name)}</td>
                    <td className="font-mono">#{byTemp.indexOf(id) + 1}</td>
                    <td className="font-mono">#{byRisk.indexOf(id) + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-sand/45 mt-2">Where the two ranks differ, humidity and vulnerability — not temperature — change the outcome.</p>
          </Card>
        </div>
      </div>

      <Collapsible title="Technical explanation trace">
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-sand/70">
          {r.explanation.map((line, i) => <li key={i}>{line}</li>)}
        </ol>
      </Collapsible>
      <NextStep label="See recommended actions" onClick={() => navigate('alerts')} />
    </div>
  )
}
