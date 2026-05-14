'use client'

import dynamic from 'next/dynamic'

type MonthlyPoint = { month: string; count: number }
type SectorPoint = { sector: string; avgAdvancement: number }
type VotePoint = { label: string; count: number; color: string }

interface AnalyticsChartsProps {
  monthly: MonthlyPoint[]
  sectors: SectorPoint[]
  votes: VotePoint[]
}

const AnalyticsCharts = dynamic(() => import('./AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="bg-gray-100 rounded-lg" style={{ height: i === 1 ? 240 : 280 }} />
        </div>
      ))}
    </div>
  ),
})

export default function AnalyticsChartsClient(props: AnalyticsChartsProps) {
  return <AnalyticsCharts {...props} />
}
