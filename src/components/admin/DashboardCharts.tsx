'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { SIGNALEMENT_CATEGORIES } from '@/lib/constants'

type CategoryData = { category: string; count: number }
type StatusData = { status: string; count: number }

const CATEGORY_COLORS: Record<string, string> = {
  URBANISME:          '#6366f1',
  TRANSPORT:          '#3b82f6',
  ENVIRONNEMENT:      '#10b981',
  VOIRIE:             '#f59e0b',
  EAU:                '#06b6d4',
  DECHETS:            '#84cc16',
  EQUIPEMENTS_PUBLICS:'#8b5cf6',
  SANTE:              '#ec4899',
  EDUCATION:          '#f97316',
}

const STATUS_COLORS: Record<string, string> = {
  RECU:           '#f59e0b',
  EN_COURS:       '#3b82f6',
  PRIS_EN_CHARGE: '#8b5cf6',
  RESOLU:         '#10b981',
  REJETE:         '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  RECU: 'Reçu', EN_COURS: 'En cours', PRIS_EN_CHARGE: 'Pris en charge',
  RESOLU: 'Résolu', REJETE: 'Rejeté',
}

interface Props {
  byCategory: CategoryData[]
  byStatus: StatusData[]
}

export default function DashboardCharts({ byCategory, byStatus }: Props) {
  const categoryData = byCategory.map((d) => ({
    name: SIGNALEMENT_CATEGORIES[d.category as keyof typeof SIGNALEMENT_CATEGORIES] ?? d.category,
    key: d.category,
    count: d.count,
  }))

  const statusData = byStatus.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    key: d.status,
    count: d.count,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Signalements by category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Signalements par catégorie</h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-40}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v ?? 0, 'Signalements']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {categoryData.map((d) => (
                  <Cell key={d.key} fill={CATEGORY_COLORS[d.key] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Signalements by status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Signalements par statut</h3>
        {statusData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData} layout="vertical" margin={{ top: 4, right: 24, left: 64, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={80}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [v ?? 0, 'Signalements']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {statusData.map((d) => (
                  <Cell key={d.key} fill={STATUS_COLORS[d.key] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
