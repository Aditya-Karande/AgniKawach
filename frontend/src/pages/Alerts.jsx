import { useEffect, useState } from 'react'
import { getAlert } from '../api'
import { Card, RiskBadge, StatusBadge, Empty } from '../components/ui'
import { bandColor, shortName } from '../riskTheme'

const TABS = [
  { id: 'citizen', label: 'Citizen', blurb: 'Plain-language public advisory' },
  { id: 'hospital', label: 'Hospital', blurb: 'Preparedness for health facilities' },
  { id: 'municipality', label: 'Municipality', blurb: 'Interventions and field deployment' },
]
const CHANNELS = [
  ['In-dashboard advisory', 'live'],
  ['SMS', 'planned'],
  ['WhatsApp', 'planned'],
  ['Push notification', 'planned'],
]

export default function Alerts({ ctx }) {
  const { wardsById, riskByWard, selectedWardId, setSelectedWardId, selectedRisk: r, selectedDay } = ctx
  const [tab, setTab] = useState('citizen')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selectedWardId) return
    let off = false
    setLoading(true); setText('')
    getAlert(selectedWardId, selectedDay, tab)
      .then((res) => !off && setText(res.text))
      .catch((e) => !off && setText(`Could not load alert: ${e.message}`))
      .finally(() => !off && setLoading(false))
    return () => { off = true }
  }, [selectedWardId, selectedDay, tab])

  const copy = () => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  const ranked = Object.values(riskByWard).sort((a, b) => b.risk.score - a.risk.score)
  if (!r) return <Empty text="Select a ward to generate alerts." />
  const active = TABS.find((t) => t.id === tab)

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-sand/55">Ward</label>
        <select value={selectedWardId} onChange={(e) => setSelectedWardId(e.target.value)} className="bg-base-900 border border-base-600 rounded-md px-3 py-1.5 text-sm">
          {ranked.map((x) => <option key={x.ward_id} value={x.ward_id}>{shortName(wardsById[x.ward_id]?.name)} — {x.risk.band} ({x.risk.score.toFixed(2)})</option>)}
        </select>
        <RiskBadge band={r.risk.band} />
        <span className="text-xs text-sand/50 font-mono">WBGT {r.hazard.wbgt}°C · {r.date}</span>
      </div>

      <div className="flex border-b border-base-600">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === t.id ? 'border-sand text-sand' : 'border-transparent text-sand/50 hover:text-sand'}`}>{t.label}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title={`${active.label} message`} subtitle={active.blurb} className="lg:col-span-2"
          right={<button onClick={copy} className="text-xs font-semibold border border-base-600 rounded-md px-2.5 py-1 hover:bg-base-700">{copied ? 'Copied' : 'Copy'}</button>}>
          <div className="rounded-md border border-base-600 p-4 bg-base-800" style={{ borderLeft: `4px solid ${bandColor(r.risk.band)}` }}>
            <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed min-h-[110px]">{loading ? 'Generating…' : text}</pre>
          </div>

          {tab === 'hospital' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-base-800 rounded-md p-3">
                <div className="text-[10px] uppercase text-sand/50">Est. admission increase</div>
                <div className="text-lg font-semibold">{r.health_impact.low_pct}–{r.health_impact.high_pct}%</div>
              </div>
              <div className="bg-base-800 rounded-md p-3">
                <div className="text-[10px] uppercase text-sand/50">Confidence</div>
                <div className="text-xs mt-1">{r.health_impact.confidence}</div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {tab !== 'citizen' && (
            <Card title="Recommended actions" subtitle={tab === 'hospital' ? 'Health-system view' : 'Rule-based from risk band and top driver'}>
              <ul className="space-y-2">
                {(tab === 'hospital' ? r.actions.filter((a) => /hospital|PHC|health|ASHA/i.test(a)) : r.actions).map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm"><span className="text-sand/40">▢</span>{a}</li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Delivery channels" subtitle="Message generation is live; dispatch is not yet connected">
            <ul className="space-y-2">
              {CHANNELS.map(([c, s]) => (
                <li key={c} className="flex justify-between items-center text-sm"><span>{c}</span><StatusBadge status={s} /></li>
              ))}
            </ul>
            <p className="text-[11px] text-sand/45 mt-3">SMS, WhatsApp and push are planned integrations; nothing is sent automatically today.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
