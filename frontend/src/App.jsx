import { useEffect, useMemo, useState } from 'react'
import Sidebar, { PAGES } from './components/Sidebar'
import Header from './components/Header'
import Overview from './pages/Overview'
import RiskMap from './pages/RiskMap'
import WardAnalysis from './pages/WardAnalysis'
import Explanation from './pages/Explanation'
import Forecast from './pages/Forecast'
import Alerts from './pages/Alerts'
import Vulnerability from './pages/Vulnerability'
import DataInsights from './pages/DataInsights'
import { getWards, getRiskAll, getForecast } from './api'
import { useTheme } from './hooks/useTheme'

const DAY_COUNT = 5
const VIEWS = {
  overview: Overview, map: RiskMap, ward: WardAnalysis, why: Explanation,
  forecast: Forecast, alerts: Alerts, vulnerability: Vulnerability, data: DataInsights,
}

function useHashPage() {
  const read = () => {
    const id = window.location.hash.replace('#/', '')
    return PAGES.some((p) => p.id === id) ? id : 'overview'
  }
  const [page, setPage] = useState(read)
  useEffect(() => {
    const on = () => setPage(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [page, (id) => { window.location.hash = `#/${id}` }]
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [page, navigate] = useHashPage()
  const [wards, setWards] = useState([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedWardId, setSelectedWardId] = useState(null)
  const [riskByWard, setRiskByWard] = useState({})
  const [riskLoading, setRiskLoading] = useState(false)
  const [forecastAll, setForecastAll] = useState([])
  const [dayLabels, setDayLabels] = useState(Array(DAY_COUNT).fill(null))
  const [error, setError] = useState(null)

  const wardsById = useMemo(() => Object.fromEntries(wards.map((w) => [w.id, w])), [wards])

  useEffect(() => {
    getWards().then(setWards).catch((err) => setError(`Could not load wards: ${err.message}`))
  }, [])

  // risk for every ward for the selected day
  useEffect(() => {
    if (!wards.length) return
    let cancelled = false
    setRiskLoading(true)
    getRiskAll(selectedDay)
      .then((data) => {
        if (cancelled) return
        setRiskByWard(Object.fromEntries(data.map((r) => [r.ward_id, r])))
        // default selection = highest-risk ward, only if nothing chosen yet
        setSelectedWardId((cur) => cur ?? [...data].sort((a, b) => b.risk.score - a.risk.score)[0]?.ward_id ?? null)
        setError(null)
      })
      .catch((err) => setError(`Could not load risk data: ${err.message}`))
      .finally(() => !cancelled && setRiskLoading(false))
    return () => { cancelled = true }
  }, [wards, selectedDay])

  // full 5-day forecast for the selected ward (also supplies the date labels)
  useEffect(() => {
    if (!selectedWardId) return
    let cancelled = false
    getForecast(selectedWardId)
      .then((fc) => {
        if (cancelled) return
        setForecastAll(fc)
        setDayLabels(fc.slice(0, DAY_COUNT).map((d) => ({ date: d.date })))
      })
      .catch(() => !cancelled && setForecastAll([]))
    return () => { cancelled = true }
  }, [selectedWardId])

  const ctx = {
    wards, wardsById, riskByWard, selectedDay, setSelectedDay, selectedWardId, setSelectedWardId,
    selectedWard: wardsById[selectedWardId], selectedRisk: riskByWard[selectedWardId],
    selectedForecast: forecastAll[selectedDay] ?? null, theme, navigate,
  }
  const current = PAGES.find((p) => p.id === page)
  const View = VIEWS[page]
  const fullBleed = page === 'map'

  return (
    <div className="h-screen w-screen flex bg-base-950 font-body text-sand">
      <Sidebar page={page} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header page={current} days={dayLabels} selectedDay={selectedDay} onSelectDay={setSelectedDay} loading={riskLoading} theme={theme} onToggleTheme={toggleTheme} />
        {error && <div className="bg-risk-extreme/10 border-b border-risk-extreme/40 text-risk-extreme text-xs px-6 py-2">{error}</div>}
        <main className={`flex-1 min-h-0 pb-16 md:pb-0 ${fullBleed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <View ctx={ctx} />
        </main>
      </div>
    </div>
  )
}
