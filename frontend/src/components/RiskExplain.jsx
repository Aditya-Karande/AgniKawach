import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts'

function ProvenanceBadge({ source }) {
  const verified = source?.toLowerCase().startsWith('verified')
  return (
    <span
      title={source}
      className={[
        'text-[9px] font-mono px-1 py-0.5 rounded uppercase tracking-wide shrink-0 cursor-help',
        verified
          ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
          : 'bg-sand/10 text-sand/50 border border-sand/20',
      ].join(' ')}
    >
      {verified ? 'verified' : 'estimated'}
    </span>
  )
}

export default function RiskExplain({ ward, risk, theme = 'dark' }) {
  if (!ward || !risk) return null

  const isDark = theme === 'dark'
  const tickColor = isDark ? '#EDE6DA' : '#1E2126'
  const axisLineColor = isDark ? '#243346' : '#D8D1C1'
  const tooltipBg = isDark ? '#101B28' : '#FFFFFF'

  const chartData = risk.vulnerability.components
    .slice()
    .sort((a, b) => b.contribution - a.contribution)
    .map((c) => ({ name: c.label, contribution: c.contribution, raw: c.raw_value, field: c.field }))

  return (
    <div className="bg-base-800 border border-base-600 rounded p-4 space-y-5">
      <div>
        <div className="text-[10px] tracking-wide text-sand/50 font-display uppercase mb-3">
          Vulnerability drivers
        </div>
        <div style={{ width: '100%', height: 170 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" hide domain={[0, 0.3]} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={{ stroke: axisLineColor }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: tooltipBg, border: `1px solid ${axisLineColor}`, borderRadius: 4 }}
                labelStyle={{ color: tickColor }}
                formatter={(value, name, props) => [`${value} (raw: ${props.payload.raw})`, 'contribution']}
              />
              <Bar dataKey="contribution" radius={[0, 3, 3, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.field}
                    fill={entry.field === risk.vulnerability.dominant_driver_field ? '#E8622C' : '#3F8F6F'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-wide text-sand/50 font-display uppercase mb-2">
          Ward stats &amp; data provenance
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {Object.entries(ward.sources || {})
            .filter(([field]) => field !== 'population')
            .map(([field, source]) => (
              <div key={field} className="flex items-center justify-between gap-2">
                <span className="text-sand/60 truncate">{field.replace(/_/g, ' ')}</span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono text-sand">{ward[field]}</span>
                  <ProvenanceBadge source={source} />
                </span>
              </div>
            ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] tracking-wide text-sand/50 font-display uppercase mb-2">
          Explanation trace
        </div>
        <ol className="space-y-1.5 text-xs text-sand/70 list-decimal list-inside">
          {risk.explanation.map((line, i) => (
            <li key={i} className="leading-snug">
              {line}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
