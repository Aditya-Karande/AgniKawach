import { useEffect, useState } from 'react'
import { getAlert } from '../api'

const AUDIENCES = [
  { id: 'citizen', label: 'Citizen' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'municipality', label: 'Municipality' },
]

export default function AlertPanel({ wardId, day }) {
  const [active, setActive] = useState('citizen')
  const [texts, setTexts] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTexts({})
  }, [wardId, day])

  useEffect(() => {
    if (!wardId || texts[active]) return
    let cancelled = false
    setLoading(true)
    getAlert(wardId, day, active)
      .then((res) => {
        if (!cancelled) setTexts((prev) => ({ ...prev, [active]: res.text }))
      })
      .catch((err) => {
        if (!cancelled) setTexts((prev) => ({ ...prev, [active]: `Could not load alert: ${err.message}` }))
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [wardId, day, active, texts])

  if (!wardId) return null

  return (
    <div className="bg-base-800 border border-base-600 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] tracking-wide text-sand/50 font-display uppercase">
          Alert message
        </div>
        <div className="flex gap-1">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              onClick={() => setActive(a.id)}
              className={[
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                active === a.id
                  ? 'bg-ember-600 text-sand'
                  : 'bg-base-700 text-sand/50 hover:text-sand',
              ].join(' ')}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <pre className="whitespace-pre-wrap font-mono text-xs text-sand/80 bg-base-900 border border-base-700 rounded p-3 min-h-[96px]">
        {loading && !texts[active] ? 'Generating…' : texts[active] || ''}
      </pre>
    </div>
  )
}
