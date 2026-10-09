import { useState } from 'react'
import MapView, { LAYERS } from '../components/MapView'
import { RiskBadge, Empty } from '../components/ui'
import { bandColor, shortName } from '../riskTheme'

export default function RiskMap({ ctx }) {
  const { wards, wardsById, riskByWard, selectedWardId, setSelectedWardId, selectedRisk, theme, navigate } = ctx
  const [layer, setLayer] = useState('risk')
  const [listOpen, setListOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const rows = Object.values(riskByWard).sort((a, b) => b.risk.score - a.risk.score)
  const w = wardsById[selectedWardId]

  const pick = (id) => { setSelectedWardId(id); setPreviewOpen(true) }

  return (
    <div className="relative h-full">
      <MapView wards={wards} riskByWard={riskByWard} selectedWardId={previewOpen ? selectedWardId : null} onSelect={pick} theme={theme} layer={layer} />

      {/* layer controls */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-[calc(100%-1.5rem)] overflow-x-auto flex bg-base-900/95 border border-base-600 rounded-md">
        {LAYERS.map((l) => (
          <button key={l.id} onClick={() => setLayer(l.id)}
            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap border-l border-base-600 first:border-l-0 ${layer === l.id ? 'bg-sand text-base-900' : 'text-sand/70 hover:bg-base-700'}`}>
            {l.label}
          </button>
        ))}
      </div>

      {/* ranked wards */}
      <div className="absolute top-14 left-3 z-[1000] w-64 max-w-[calc(100%-1.5rem)]">
        <button onClick={() => setListOpen(!listOpen)} className="w-full flex justify-between items-center bg-base-900/95 border border-base-600 rounded-md px-3 py-2 text-xs font-semibold">
          Risk-ranked wards <span className="text-sand/50">{listOpen ? '−' : '+'}</span>
        </button>
        {listOpen && (
          <div className="mt-1 bg-base-900/95 border border-base-600 rounded-md max-h-[40vh] overflow-y-auto">
            {rows.length === 0 && <Empty text="Loading…" />}
            {rows.map((r, i) => (
              <button key={r.ward_id} onClick={() => pick(r.ward_id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left border-t border-base-700 first:border-t-0 hover:bg-base-800 ${r.ward_id === selectedWardId ? 'bg-base-800' : ''}`}>
                <span className="font-mono text-[10px] text-sand/40 w-3">{i + 1}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: bandColor(r.risk.band) }} />
                <span className="flex-1 text-xs font-medium truncate">{shortName(wardsById[r.ward_id]?.name)}</span>
                <span className="font-mono text-xs" style={{ color: bandColor(r.risk.band) }}>{r.risk.score.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ward preview */}
      {previewOpen && w && selectedRisk && (
        <div className="absolute bottom-16 md:bottom-4 right-3 z-[1000] w-72 max-w-[calc(100%-1.5rem)] bg-base-900 border border-base-600 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-base font-semibold">{shortName(w.name)}</div>
              <RiskBadge band={selectedRisk.risk.band} className="mt-1" />
            </div>
            <button onClick={() => setPreviewOpen(false)} className="text-sand/40 hover:text-sand text-lg leading-none" aria-label="Close">×</button>
          </div>
          <dl className="grid grid-cols-3 gap-2 mt-3 text-center">
            {[['Risk', selectedRisk.risk.score.toFixed(2)], ['WBGT', `${selectedRisk.hazard.wbgt}°C`], ['Vulnerability', selectedRisk.vulnerability.score.toFixed(2)]].map(([k, v]) => (
              <div key={k} className="bg-base-800 rounded-md py-2"><dt className="text-[10px] text-sand/50">{k}</dt><dd className="font-semibold text-sm">{v}</dd></div>
            ))}
          </dl>
          <button onClick={() => navigate('ward')} className="mt-3 w-full bg-sand text-base-900 rounded-md py-2 text-sm font-semibold hover:opacity-90">Open Ward Analysis →</button>
        </div>
      )}
    </div>
  )
}
