'use client'

export default function AdvancementBar({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, rate))
  const color =
    pct >= 80 ? 'bg-emerald-500'
    : pct >= 50 ? 'bg-blue-500'
    : pct >= 20 ? 'bg-amber-500'
    : 'bg-gray-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  )
}
