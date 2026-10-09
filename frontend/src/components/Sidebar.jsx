import { useEffect, useState } from 'react'
import { Icon, StatusBadge } from './ui'
import { getHealth } from '../api'

export const PAGES = [
  { id: 'overview', label: 'Overview', icon: 'overview', title: 'Overview', q: 'Do I need to worry?' },
  { id: 'map', label: 'Risk Map', icon: 'map', title: 'Risk Map', q: 'Where is the risk?' },
  { id: 'ward', label: 'Ward Analysis', icon: 'ward', title: 'Ward Analysis', q: 'How bad is it?' },
  { id: 'why', label: 'Explanation', icon: 'why', title: 'Why this risk?', q: 'Why is it high?' },
  { id: 'forecast', label: 'Forecast', icon: 'forecast', title: 'Heat-Risk Forecast', q: 'How will it change?' },
  { id: 'alerts', label: 'Alerts & Actions', icon: 'alerts', title: 'Alerts & Actions', q: 'What do we do?' },
  { id: 'vulnerability', label: 'Vulnerability', icon: 'vulnerability', title: 'Community Vulnerability', q: 'Who is most exposed?' },
  { id: 'data', label: 'Data & Insights', icon: 'data', title: 'Data & Insights', q: 'Where does the data come from?' },
]

function useApiStatus() {
  const [s, setS] = useState('checking')
  useEffect(() => {
    getHealth().then(() => setS('online')).catch(() => setS('offline'))
  }, [])
  return s
}

export default function Sidebar({ page, onNavigate, theme, onToggleTheme }) {
  const api = useApiStatus()
  return (
    <>
      {/* tablet + desktop: side rail (icons only on md, full on lg) */}
      <aside className="hidden md:flex flex-col shrink-0 w-[68px] lg:w-60 bg-base-900 border-r border-base-600">
        <div className="h-16 flex items-center gap-3 px-4 border-b border-base-600">
          <div className="w-8 h-8 rounded-md bg-sand text-base-900 flex items-center justify-center font-bold text-sm shrink-0">A</div>
          <div className="hidden lg:block leading-tight">
            <div className="text-sm font-bold tracking-wide">AAGNI-SHIELD</div>
            <div className="text-[10px] text-sand/50">Heat → Health Intelligence</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => onNavigate(p.id)}
              title={p.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
                page === p.id ? 'bg-sand text-base-900' : 'text-sand/70 hover:bg-base-700'
              }`}
            >
              <Icon name={p.icon} />
              <span className="hidden lg:inline">{p.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-base-600 p-3 space-y-2 text-[12px]">
          <div className="flex items-center justify-between lg:px-1" title="Backend API status">
            <span className="hidden lg:inline text-sand/60">System status</span>
            <StatusBadge status={api === 'online' ? 'live' : api === 'offline' ? 'unavailable' : 'planned'} title="Backend API" />
          </div>
          <button onClick={() => onNavigate('data')} className="hidden lg:block w-full text-left px-1 text-sand/60 hover:text-sand">Data sources</button>
          <button onClick={onToggleTheme} className="w-full flex items-center gap-2 px-1 text-sand/60 hover:text-sand" title="Toggle theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
            <span className="hidden lg:inline">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
          </button>
        </div>
      </aside>

      {/* mobile: bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[2000] bg-base-900 border-t border-base-600 flex overflow-x-auto">
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => onNavigate(p.id)}
            className={`flex-1 min-w-[68px] flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${page === p.id ? 'text-sand border-t-2 border-sand -mt-px' : 'text-sand/50'}`}
          >
            <Icon name={p.icon} />
            {p.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </>
  )
}
