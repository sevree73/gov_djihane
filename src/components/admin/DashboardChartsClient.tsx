'use client'

import dynamic from 'next/dynamic'

const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-[340px] animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-full bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  ),
})

export default DashboardCharts
