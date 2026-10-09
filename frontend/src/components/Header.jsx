import { Icon } from './ui'

export default function Header({ page, days, selectedDay, onSelectDay, loading, onToggleTheme, theme }) {
  return (
    <header className="shrink-0 bg-base-900 border-b border-base-600 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] font-bold tracking-widest text-sand/45">AAGNI-SHIELD · MUMBAI HEAT RISK INTELLIGENCE</div>
        <h1 className="text-lg font-semibold leading-tight">{page.title}
          <span className="hidden sm:inline text-sm font-normal text-sand/45 ml-3">{page.q}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {loading && <span className="text-[11px] text-sand/45 font-mono">refreshing…</span>}
        <span className="hidden sm:flex items-center gap-1 text-xs text-sand/60 border border-base-600 rounded-md px-2 py-1.5">
          <Icon name="pin" className="w-3.5 h-3.5" /> Mumbai
        </span>
        <DayTabs days={days} selectedDay={selectedDay} onSelect={onSelectDay} />
        <button onClick={onToggleTheme} className="md:hidden p-1.5 border border-base-600 rounded-md" aria-label="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export function DayTabs({ days, selectedDay, onSelect }) {
  return (
    <div className="flex border border-base-600 rounded-md overflow-hidden">
      {days.map((d, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          title={d?.date ?? ''}
          className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium border-l border-base-600 first:border-l-0 ${
            i === selectedDay ? 'bg-sand text-base-900' : 'bg-base-900 text-sand/65 hover:bg-base-700'
          }`}
        >
          <div className="leading-none">{i === 0 ? 'Today' : `+${i}`}<span className="hidden sm:inline">{i > 0 ? ' Day' : ''}</span></div>
          {d?.date && <div className={`text-[9px] font-mono mt-0.5 ${i === selectedDay ? 'opacity-70' : 'text-sand/40'}`}>{d.date.slice(5)}</div>}
        </button>
      ))}
    </div>
  )
}
