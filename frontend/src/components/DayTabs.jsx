export default function DayTabs({ days, selectedDay, onSelect }) {
  return (
    <div className="flex gap-1">
      {days.map((d, i) => (
        <button
          key={d?.date ?? i}
          onClick={() => onSelect(i)}
          className={[
            'px-3 py-2 rounded text-sm font-medium transition-colors border',
            i === selectedDay
              ? 'bg-ember-600 border-ember-500 text-sand'
              : 'bg-base-800 border-base-600 text-sand/60 hover:text-sand hover:border-ember-600/60',
          ].join(' ')}
        >
          <div className="font-display leading-none">
            {i === 0 ? 'Today' : `+${i}d`}
          </div>
          {d?.date && (
            <div className="text-[10px] font-mono text-sand/40 mt-0.5">
              {d.date.slice(5)}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
