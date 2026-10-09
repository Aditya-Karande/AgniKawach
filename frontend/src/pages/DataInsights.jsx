import { Card, StatusBadge, Empty, dataStatus, FIELD_LABEL } from '../components/ui'
import { shortName } from '../riskTheme'

export default function DataInsights({ ctx }) {
  const { wards, selectedForecast: f, riskByWard } = ctx
  if (!wards.length) return <Empty />
  const anyRisk = Object.values(riskByWard)[0]
  const wx = f?.source
  const demo = wards.flatMap((w) => Object.entries(w.sources || {}).map(([k, s]) => dataStatus(s, w[k])))
  const count = (s) => demo.filter((x) => x === s).length

  const sources = [
    { group: 'Weather', name: 'Temperature, humidity, wind forecast', source: wx === 'open-meteo' ? 'Open-Meteo forecast API' : wx ? `${wx} (mock fallback data)` : 'Unavailable', status: wx === 'open-meteo' ? 'available' : wx ? 'estimated' : 'unavailable', updated: anyRisk ? `Forecast for ${anyRisk.date}` : '—' },
    { group: 'Environmental', name: 'Heat stress (WBGT) & local heat adjustment', source: 'Computed in backend from forecast + ward characteristics', status: 'estimated', updated: 'On request' },
    { group: 'Ward', name: 'Population, density, age, workers, housing, green cover', source: 'Ward data file (2001 Census tables + published studies)', status: 'estimated', updated: '2001 census basis (see note)', detail: `${count('verified')} verified · ${count('estimated')} estimated · ${count('unavailable')} unavailable fields` },
    { group: 'GIS', name: 'BMC administrative ward boundaries', source: 'Datameet Municipal_Spatial_Data (loaded at runtime)', status: 'available', updated: '—' },
    { group: 'Health', name: 'Heat-attributable admission estimate', source: 'Rule-based placeholder, not a fitted model', status: 'estimated', updated: 'On request' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4">
      <Card title="Data sources" subtitle="Provenance for every input to the risk score">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-[10px] uppercase text-sand/45 text-left"><th className="font-medium py-1">Category</th><th className="font-medium">Data</th><th className="font-medium">Source</th><th className="font-medium">Status</th><th className="font-medium">Last updated</th></tr></thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.group} className="border-t border-base-700 align-top">
                  <td className="py-2.5 font-semibold">{s.group}</td>
                  <td>{s.name}{s.detail && <div className="text-[11px] text-sand/50">{s.detail}</div>}</td>
                  <td className="text-sand/70 text-xs">{s.source}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-xs text-sand/60">{s.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Ward data verification" subtitle="Per field: verified against a cited source, estimated, or unavailable. Hover for the source.">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead><tr className="text-[10px] uppercase text-sand/45 text-left"><th className="font-medium py-1">Ward</th>{Object.keys(FIELD_LABEL).map((k) => <th key={k} className="font-medium">{FIELD_LABEL[k]}</th>)}</tr></thead>
            <tbody>
              {wards.map((w) => (
                <tr key={w.id} className="border-t border-base-700">
                  <td className="py-2 font-medium">{shortName(w.name)}</td>
                  {Object.keys(FIELD_LABEL).map((k) => <td key={k}><StatusBadge status={dataStatus(w.sources?.[k], w[k])} title={w.sources?.[k]} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-sand/45 mt-3">Population/density use 2001 census ward tables and are directional. Verified fields cite published sources; estimated fields are placeholders pending the 2011 ward census data.</p>
      </Card>
    </div>
  )
}
