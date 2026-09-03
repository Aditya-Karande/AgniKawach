import { bandColor } from '../riskTheme'

export default function WardList({ riskByWard, wardsById, selectedWardId, onSelect, loading }) {
  const rows = Object.values(riskByWard).sort((a, b) => b.risk.score - a.risk.score)

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-base-600 flex items-baseline justify-between">
        <h2 className="font-display text-sm tracking-wide text-sand/80">
          Wards ranked by risk
        </h2>
        {loading && <span className="text-[10px] text-sand/40 font-mono">refreshing…</span>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <div className="p-4 text-sm text-sand/40">Loading ward risk…</div>
        )}
        {rows.map((r, idx) => {
          const ward = wardsById[r.ward_id]
          if (!ward) return null
          const selected = r.ward_id === selectedWardId
          return (
            <button
              key={r.ward_id}
              onClick={() => onSelect(r.ward_id)}
              className={[
                'w-full text-left px-4 py-3 border-b border-base-800 flex items-center gap-3 transition-colors',
                selected ? 'bg-base-700' : 'hover:bg-base-800',
              ].join(' ')}
            >
              <span className="w-5 text-right font-mono text-xs text-sand/40 shrink-0">
                {idx + 1}
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: bandColor(r.risk.band) }}
              />
              <span className="flex-1 min-w-0">
                <div className="text-sm text-sand truncate">{ward.name}</div>
                <div className="text-[11px] text-sand/40 font-mono">
                  WBGT {r.hazard.wbgt}°C · vuln {r.vulnerability.score.toFixed(2)}
                </div>
              </span>
              <span
                className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded shrink-0"
                style={{
                  color: bandColor(r.risk.band),
                  border: `1px solid ${bandColor(r.risk.band)}55`,
                }}
              >
                {r.risk.score.toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
