'use client'

import { SIGNALEMENT_STATUSES } from '@/lib/constants'

const STATUS_STYLES: Record<string, string> = {
  RECU:          'bg-amber-100 text-amber-800 border-amber-200',
  EN_COURS:      'bg-blue-100 text-blue-800 border-blue-200',
  PRIS_EN_CHARGE:'bg-purple-100 text-purple-800 border-purple-200',
  RESOLU:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJETE:        'bg-red-100 text-red-800 border-red-200',
}

export default function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
  const label = SIGNALEMENT_STATUSES[status as keyof typeof SIGNALEMENT_STATUSES] ?? status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}
