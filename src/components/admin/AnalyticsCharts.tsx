'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

type MonthlyPoint = { month: string; count: number }
type SectorPoint = { sector: string; avgAdvancement: number }
type VotePoint = { label: string; count: number; color: string }

interface AnalyticsChartsProps {
  monthly: MonthlyPoint[]
  sectors: SectorPoint[]
  votes: VotePoint[]
}

export default function AnalyticsCharts({ monthly, sectors, votes }: AnalyticsChartsProps) {
  return (
    <div className="space-y-8">
      {/* Line chart — monthly signalements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Signalements par mois (12 derniers mois)</h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthly} margin={{ top: 4, right: 16, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v ?? 0, '']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart — sector advancement */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Taux d'avancement moyen par secteur</h3>
        {sectors.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, sectors.length * 42)}>
            <BarChart
              data={sectors}
              layout="vertical"
              margin={{ top: 4, right: 32, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="sector"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={140}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v ?? 0, '']}
              />
              <Bar dataKey="avgAdvancement" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart — vote breakdown */}
      {votes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Résultats des consultations — Pour / Neutre / Contre
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={votes}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
              >
                {votes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v ?? 0, '']}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
