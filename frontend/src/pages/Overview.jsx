import { useMemo } from 'react'
import MapView from '../components/MapView'
import { Card, Kpi, RiskBadge, WardTable, VulnerabilityBars, Empty } from '../components/ui'
import { bandColor, BAND_ORDER, shortName } from '../riskTheme'
import { NextStep } from '../components/ui'

export default function Overview({ ctx }) {
  const { wards, wardsById, riskByWard, theme, navigate, setSelectedWardId } = ctx
  const rows = useMemo(() => Object.values(riskByWard).sort((a, b) => b.risk.score - a.risk.score), [riskByWard])
  if (!rows.length) return <Empty text="Loading ward risk…" />

  const top = rows[0]
  const topWard = wardsById[top.ward_id]
  const extreme = rows.filter((r) => r.risk.band === 'Extreme').length
  const highPlus = rows.filter((r) => ['Extreme', 'High'].includes(r.risk.band))
  const overallBand = BAND_ORDER.find((b) => rows.some((r) => r.risk.band === b))
  const peak = rows.reduce((m, r) => (r.hazard.wbgt > m.hazard.wbgt ? r : m), rows[0])
  const knownPop = highPlus.reduce((s, r) => s + (wardsById[r.ward_id]?.population ?? 0), 0)
  const missingPop = highPlus.filter((r) => wardsById[r.ward_id]?.population == null).length

  const open = (id, page) => { setSelectedWardId(id); navigate(page) }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1500px] mx-auto">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <Kpi label="Overall heat risk" value={overallBand.toUpperCase()} color={bandColor(overallBand)} sub={`Worst ward · ${highPlus.length} of ${rows.length} wards High or above`} />
        <Kpi label="Extreme-risk wards" value={extreme} color={extreme ? bandColor('Extreme') : undefined} sub={`of ${rows.length} monitored wards`} />
        <Kpi label="Highest-risk ward" value={shortName(topWard?.name)} sub={`Risk ${top.risk.score.toFixed(2)}`} onClick={() => open(top.ward_id, 'ward')} />
        <Kpi label="Peak heat stress" value={`${peak.hazard.wbgt}°C`} sub={`WBGT · ${shortName(wardsById[peak.ward_id]?.name)}`} />
        <Kpi
          label="Pop. in High/Extreme wards"
          value={knownPop ? knownPop.toLocaleString() : 'No data'}
          sub={missingPop ? `Excludes ${missingPop} ward(s) with no population figure` : 'Census-based (2001 ward tables)'}
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-4">
        <Card title="Current heat risk map" subtitle="Click a ward to inspect it on the Risk Map" className="xl:col-span-2" pad={false}>
          <div className="h-[380px] md:h-[460px] rounded-b-lg overflow-hidden">
            <MapView wards={wards} riskByWard={riskByWard} selectedWardId={null} theme={theme} flyTo={false} onSelect={(id) => open(id, 'map')} />
          </div>
        </Card>
        <Card title="Top risk wards" right={<button onClick={() => navigate('map')} className="text-xs font-semibold text-sand/60 hover:text-sand">Risk map →</button>}>
          <WardTable riskByWard={riskByWard} wardsById={wardsById} limit={6} onSelect={(id) => open(id, 'ward')} />
          <p className="text-[11px] text-sand/45 mt-3">Heat stress = WBGT. Risk combines heat stress with community vulnerability.</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={`Key risk drivers — ${shortName(topWard?.name)}`} subtitle="Why the highest-risk ward is exposed">
          <VulnerabilityBars components={top.vulnerability.components} dominantField={top.vulnerability.dominant_driver_field} />
        </Card>
        <Card title="Active alerts" subtitle="Most urgent wards" right={<button onClick={() => navigate('alerts')} className="text-xs font-semibold text-sand/60 hover:text-sand">View all alerts →</button>}>
          <ul className="divide-y divide-base-700">
            {rows.slice(0, 3).map((r) => (
              <li key={r.ward_id} className="py-3 flex gap-3 items-start cursor-pointer" onClick={() => open(r.ward_id, 'alerts')}>
                <span className="w-1 self-stretch rounded" style={{ background: bandColor(r.risk.band) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{shortName(wardsById[r.ward_id]?.name)}</span>
                    <RiskBadge band={r.risk.band} />
                  </div>
                  <div className="text-xs text-sand/60 mt-0.5 truncate">{r.actions[0]}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <NextStep label="Explore the Risk Map" onClick={() => navigate('map')} />
    </div>
  )
}
