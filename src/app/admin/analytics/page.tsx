import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import AnalyticsChartsClient from '@/components/admin/AnalyticsChartsClient'
import type { Role } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

type MonthRow = { month_label: string; count: bigint }

export default async function AnalyticsPage() {
  const session = await requireAdmin()

  const wilayaStr =
    WILAYA_ROLES.includes(session.role as Role) && session.wilaya
      ? session.wilaya
      : null

  const monthlySql = `
    SELECT
      TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS month_label,
      COUNT(*) AS count
    FROM "Signalement"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    ${wilayaStr ? 'AND wilaya = $1' : ''}
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY DATE_TRUNC('month', "createdAt") ASC
  `

  const monthlyRows = await prisma.$queryRawUnsafe<MonthRow[]>(
    monthlySql,
    ...(wilayaStr ? [wilayaStr] : []),
  )

  const [sectorStats, voteBreakdown, totalSignalements, totalProjets] = await Promise.all([
    prisma.project.groupBy({
      by: ['sector'],
      _avg: { advancementRate: true },
      where: wilayaStr ? { wilaya: wilayaStr } : {},
      orderBy: { _avg: { advancementRate: 'desc' } },
      take: 10,
    }),
    prisma.vote.groupBy({ by: ['value'], _count: { id: true } }),
    prisma.signalement.count({ where: wilayaStr ? { wilaya: wilayaStr } : {} }),
    prisma.project.count({ where: wilayaStr ? { wilaya: wilayaStr } : {} }),
  ])

  const monthly = monthlyRows.map((r) => ({ month: r.month_label, count: Number(r.count) }))

  const sectors = sectorStats.map((r) => ({
    sector: r.sector.length > 18 ? r.sector.slice(0, 16) + '…' : r.sector,
    avgAdvancement: Math.round(r._avg.advancementRate ?? 0),
  }))

  const voteLabels: Record<string, { label: string; color: string }> = {
    '1':  { label: 'Pour',   color: '#10b981' },
    '0':  { label: 'Neutre', color: '#6b7280' },
    '-1': { label: 'Contre', color: '#ef4444' },
  }

  const votes = voteBreakdown.map((r) => ({
    ...(voteLabels[String(r.value)] ?? { label: String(r.value), color: '#9ca3af' }),
    count: r._count.id,
  }))

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue d'ensemble des données de gouvernance participative
          {wilayaStr ? ` — Wilaya de ${wilayaStr}` : ''}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total signalements
          </p>
          <p className="text-3xl font-bold text-gray-900">{totalSignalements.toLocaleString('fr-DZ')}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Total projets
          </p>
          <p className="text-3xl font-bold text-gray-900">{totalProjets.toLocaleString('fr-DZ')}</p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsChartsClient monthly={monthly} sectors={sectors} votes={votes} />
    </div>
  )
}
