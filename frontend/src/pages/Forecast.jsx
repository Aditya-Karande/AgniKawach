import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts'
import { getRiskAll } from '../api'
import { Card, RiskBadge, Empty } from '../components/ui'
import { bandColor, BAND_BG, shortName } from '../riskTheme'

const RANK = { Low: 0, Moderate: 1, High: 2, Extreme: 3 }
const DAYS = [0, 1, 2, 3, 4]

function trend(bands) {
  const r = bands.map((b) => RANK[b] ?? 0)
  if (r[0] < 3 && r.slice(1).some((x) => x === 3)) return { label: 'Emerging extreme', color: '#C23B3B' }
  if (r.every((x) => x >= 2)) return { label: 'Persistent high', color: '#D9672E' }
  if (r[r.length - 1] < r[0]) return { label: 'Improving', color: '#3F8F6F' }
  if (r[r.length - 1] > r[0]) return { label: 'Worsening', color: '#D9672E' }
  return { label: 'Stable', color: '#6B7788' }
}

export default function Forecast({ ctx }) {
  const { wardsById, selectedWardId, setSelectedWardId, navigate, setSelectedDay } = ctx
  const [byDay, setByDay] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let off = false
    Promise.all(DAYS.map((d) => getRiskAll(d)))
      .then((res) => !off && setByDay(res))
      .catch((e) => !off && setErr(e.message))
    return () => { off = true }
  }, [])

  const table = useMemo(() => {
    if (!byDay) return []
    const ids = byDay[0].map((r) => r.ward_id)
    return ids.map((id) => {
      const cells = byDay.map((d) => d.find((r) => r.ward_id === id))
      return { id, cells, trend: trend(cells.map((c) => c.risk.band)) }
    }).sort((a, b) => b.cells[0].risk.score - a.cells[0].risk.score)
  }, [byDay])

  const chartData = useMemo(() => {
    if (!byDay) return []
    return DAYS.map((d) => {
      const rows = byDay[d]
      const sel = rows.find((r) => r.ward_id === selectedWardId)
      return {
        day: d === 0 ? 'Today' : `+${d}`,
        date: rows[0]?.date,
        'City peak WBGT': Math.max(...rows.map((r) => r.hazard.wbgt)),
        'Selected ward WBGT': sel?.hazard.wbgt,
        'City peak risk': Math.max(...rows.map((r) => r.risk.score)),
        'Selected ward risk': sel?.risk.score,
      }
    })
  }, [byDay, selectedWardId])

  if (err) return <Empty text={`Could not load forecast: ${err}`} />
  if (!byDay) return <Empty text="Loading 5-day heat-risk forecast…" />

  const emerging = table.filter((t) => t.trend.label === 'Emerging extreme').length
  const persistent = table.filter((t) => t.trend.label === 'Persistent high').length
  const improving = table.filter((t) => t.trend.label === 'Improving').length

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1300px] mx-auto">
      <div className="grid grid-cols-3 gap-3">
        {[['Emerging extreme', emerging, '#C23B3B'], ['Persistent high', persistent, '#D9672E'], ['Improving', improving, '#3F8F6F']].map(([l, n, c]) => (
          <div key={l} className="bg-base-900 border border-base-600 rounded-lg px-4 py-3">
            <div className="text-[11px] uppercase tracking-wide text-sand/55">{l}</div>
            <div className="text-2xl font-semibold" style={{ color: c }}>{n}<span className="text-xs text-sand/45 font-normal"> wards</span></div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Heat stress (WBGT) trend" subtitle={`City peak vs ${shortName(wardsById[selectedWardId]?.name ?? '')}`}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: -10, right: 10, top: 8 }}>
                <CartesianGrid stroke="#D5DCE5" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} unit="°" />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="City peak WBGT" stroke="#D9672E" strokeWidth={2} dot />
                <Line dataKey="Selected ward WBGT" stroke="#1F4E8C" strokeWidth={2} strokeDasharray="5 3" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Overall heat risk trend" subtitle="0 – 1 scale; Extreme ≥ 0.75, High ≥ 0.55">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ left: -10, right: 10, top: 8 }}>
                <CartesianGrid stroke="#D5DCE5" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="City peak risk" stroke="#C23B3B" strokeWidth={2} dot />
                <Line dataKey="Selected ward risk" stroke="#1F4E8C" strokeWidth={2} strokeDasharray="5 3" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Ward-level risk forecast" subtitle="Click a row to make it the selected ward; click a day to jump to it">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-sand/45 text-left">
                <th className="font-medium py-1">Ward</th>
                {DAYS.map((d) => <th key={d} className="font-medium text-center">{d === 0 ? 'Today' : `+${d}`}</th>)}
                <th className="font-medium text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.id} onClick={() => setSelectedWardId(row.id)} className={`border-t border-base-700 cursor-pointer hover:bg-base-800 ${row.id === selectedWardId ? 'bg-base-800' : ''}`}>
                  <td className="py-2 font-medium">{shortName(wardsById[row.id]?.name)}</td>
                  {row.cells.map((c, i) => (
                    <td key={i} className="text-center p-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedWardId(row.id); setSelectedDay(i) }}
                        className="w-full rounded font-mono text-xs font-semibold py-1.5" style={{ background: BAND_BG[c.risk.band], color: bandColor(c.risk.band) }} title={`${c.risk.band} · WBGT ${c.hazard.wbgt}°C`}>
                        {c.risk.score.toFixed(2)}
                      </button>
                    </td>
                  ))}
                  <td className="text-right text-xs font-semibold" style={{ color: row.trend.color }}>{row.trend.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">{['Extreme', 'High', 'Moderate', 'Low'].map((b) => <RiskBadge key={b} band={b} />)}</div>
        <p className="text-[11px] text-sand/45 mt-2">Forecast comes from the weather feed (see Data &amp; Insights for source); later days carry more uncertainty.</p>
      </Card>
    </div>
  )
}
