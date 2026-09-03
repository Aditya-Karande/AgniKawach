import { bandColor } from '../riskTheme'

function Stage({ label, value, sub, accent }) {
  return (
    <div className="flex-1 min-w-[100px]">
      <div className="text-[10px] tracking-wide text-sand/40 font-display uppercase mb-1">
        {label}
      </div>
      <div
        className={[
          'font-display text-lg font-semibold leading-none',
          accent ? '' : 'text-sand',
        ].join(' ')}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-sand/40 mt-1">{sub}</div>}
    </div>
  )
}

function Arrow() {
  return (
    <div className="text-ember-500/50 font-mono text-sm shrink-0 self-center px-1">
      &rarr;
    </div>
  )
}

export default function PipelineChain({ forecastDay, risk }) {
  if (!risk || !forecastDay) return null
  const band = risk.risk.band

  return (
    <div className="bg-base-800 border border-base-600 rounded p-4">
      <div className="text-[10px] tracking-wide text-sand/50 font-display uppercase mb-3">
        Pipeline
      </div>
      <div className="flex items-stretch overflow-x-auto pb-1">
        <Stage
          label="Forecast"
          value={`${forecastDay.temp_c}°C`}
          sub={`${forecastDay.rh_pct}% RH · ${forecastDay.source}`}
        />
        <Arrow />
        <Stage
          label="Hazard"
          value={`${risk.hazard.wbgt}°C`}
          sub={`WBGT · local ${risk.hazard.local_temp_c}°C (${risk.hazard.uhi_offset_c >= 0 ? '+' : ''}${risk.hazard.uhi_offset_c}°C)`}
        />
        <Arrow />
        <Stage
          label="Vulnerability"
          value={risk.vulnerability.score.toFixed(2)}
          sub={risk.vulnerability.dominant_driver}
        />
        <Arrow />
        <Stage
          label="Risk"
          value={risk.risk.score.toFixed(2)}
          sub={band}
          accent={bandColor(band)}
        />
        <Arrow />
        <Stage
          label="Action"
          value={risk.actions.length}
          sub={risk.actions[0]}
        />
      </div>
    </div>
  )
}
