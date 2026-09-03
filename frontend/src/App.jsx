import { useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import DayTabs from './components/DayTabs'
import WardList from './components/WardList'
import PipelineChain from './components/PipelineChain'
import RiskExplain from './components/RiskExplain'
import AlertPanel from './components/AlertPanel'
import ThemeToggle from './components/ThemeToggle'
import { getWards, getRiskAll, getForecast } from './api'
import { bandColor } from './riskTheme'
import { useTheme } from './hooks/useTheme'

const DAY_COUNT = 5

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [wards, setWards] = useState([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedWardId, setSelectedWardId] = useState(null)
  const [riskByWard, setRiskByWard] = useState({})
  const [riskLoading, setRiskLoading] = useState(false)
  const [selectedForecast, setSelectedForecast] = useState(null)
  const [dayLabels, setDayLabels] = useState(Array(DAY_COUNT).fill(null))
  const [error, setError] = useState(null)

  const wardsById = useMemo(() => Object.fromEntries(wards.map((w) => [w.id, w])), [wards])

  // load ward metadata once
  useEffect(() => {
    getWards()
      .then((data) => {
        setWards(data)
        if (data.length) setSelectedWardId(data[0].id)
      })
      .catch((err) => setError(`Could not load wards: ${err.message}`))
  }, [])

  // fetch risk for every ward whenever the selected day changes
  useEffect(() => {
    if (!wards.length) return
    let cancelled = false
    setRiskLoading(true)
    getRiskAll(selectedDay)
      .then((data) => {
        if (cancelled) return
        const byId = Object.fromEntries(data.map((r) => [r.ward_id, r]))
        setRiskByWard(byId)
        // once, pull date labels off the first ward's response day range
        const first = data[0]
        if (first) {
          setDayLabels((prev) => {
            const next = [...prev]
            next[selectedDay] = { date: first.date }
            return next
          })
        }
      })
      .catch((err) => setError(`Could not load risk data: ${err.message}`))
      .finally(() => !cancelled && setRiskLoading(false))
    return () => {
      cancelled = true
    }
  }, [wards, selectedDay])

  // fetch full forecast for the selected ward to feed the pipeline strip
  useEffect(() => {
    if (!selectedWardId) return
    let cancelled = false
    getForecast(selectedWardId)
      .then((forecast) => {
        if (!cancelled) setSelectedForecast(forecast[selectedDay] ?? null)
      })
      .catch(() => !cancelled && setSelectedForecast(null))
    return () => {
      cancelled = true
    }
  }, [selectedWardId, selectedDay])

  const selectedWard = wardsById[selectedWardId]
  const selectedRisk = riskByWard[selectedWardId]

  return (
    <div className="h-screen w-screen flex flex-col bg-base-950 font-body">
      {/* top bar */}
      <header className="shrink-0 h-16 border-b border-base-600 flex items-center justify-between px-5 bg-base-900">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #E8622C, #A62639)' }}
          >
            <span className="text-sand font-display text-sm font-bold">A</span>
          </div>
          <div>
            <h1 className="font-display text-base font-semibold text-sand leading-none">
              AagniShield
            </h1>
            <p className="text-[11px] text-sand/40 leading-none mt-1">
              Heat&rarr;Health ward risk engine · Mumbai
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DayTabs days={dayLabels} selectedDay={selectedDay} onSelect={setSelectedDay} />
          <div className="w-px h-6 bg-base-600" />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {error && (
        <div className="bg-risk-extreme/20 border-b border-risk-extreme/50 text-risk-extreme text-xs px-5 py-2">
          {error}
        </div>
      )}

      {/* main body */}
      <div className="flex-1 flex min-h-0">
        <aside className="w-[300px] shrink-0 border-r border-base-600 bg-base-900">
          <WardList
            riskByWard={riskByWard}
            wardsById={wardsById}
            selectedWardId={selectedWardId}
            onSelect={setSelectedWardId}
            loading={riskLoading}
          />
        </aside>

        <main className="flex-1 min-w-0">
          <MapView
            wards={wards}
            riskByWard={riskByWard}
            selectedWardId={selectedWardId}
            onSelect={setSelectedWardId}
            theme={theme}
          />
        </main>

        <aside className="w-[400px] shrink-0 border-l border-base-600 bg-base-950 overflow-y-auto">
          {selectedWard && selectedRisk ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-sand">
                    {selectedWard.name}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{
                      color: bandColor(selectedRisk.risk.band),
                      border: `1px solid ${bandColor(selectedRisk.risk.band)}55`,
                      background: `${bandColor(selectedRisk.risk.band)}15`,
                    }}
                  >
                    {selectedRisk.risk.band} risk
                  </span>
                  <span className="text-xs text-sand/40 font-mono">
                    {selectedWard.lat.toFixed(4)}, {selectedWard.lon.toFixed(4)}
                  </span>
                </div>
              </div>

              <PipelineChain forecastDay={selectedForecast} risk={selectedRisk} />
              <RiskExplain ward={selectedWard} risk={selectedRisk} theme={theme} />
              <AlertPanel wardId={selectedWardId} day={selectedDay} />
            </div>
          ) : (
            <div className="p-6 text-sm text-sand/40">Select a ward to see its risk breakdown.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
