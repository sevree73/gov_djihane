import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types'
import DashboardCharts from '@/components/admin/DashboardChartsClient'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export default async function DashboardPage() {
  const session = await requireAdmin()

  const wilayaFilter =
    WILAYA_ROLES.includes(session.role as Role) && session.wilaya
      ? { wilaya: session.wilaya }
      : {}

  const [
    totalSignalements,
    activeSignalements,
    totalProjets,
    activeProjets,
    avgAdvancement,
    totalCitizens,
    recentSignalements,
    signalementsByCategory,
    signalementsByStatus,
  ] = await Promise.all([
    prisma.signalement.count({ where: wilayaFilter }),
    prisma.signalement.count({ where: { ...wilayaFilter, status: { in: ['RECU', 'EN_COURS', 'PRIS_EN_CHARGE'] } } }),
    prisma.project.count({ where: wilayaFilter }),
    prisma.project.count({ where: { ...wilayaFilter, status: 'EN_COURS' } }),
    prisma.project.aggregate({ _avg: { advancementRate: true }, where: wilayaFilter }),
    WILAYA_ROLES.includes(session.role as Role)
      ? Promise.resolve(null)
      : prisma.user.count({ where: { role: 'CITOYEN' } }),
    prisma.signalement.findMany({
      where: wilayaFilter,
      include: { citizen: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.signalement.groupBy({
      by: ['category'],
      _count: { id: true },
      where: wilayaFilter,
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.signalement.groupBy({
      by: ['status'],
      _count: { id: true },
      where: wilayaFilter,
    }),
  ])

  const avgRate = Math.round(avgAdvancement._avg.advancementRate ?? 0)

  const kpis = [
    {
      label: 'Signalements actifs',
      value: activeSignalements,
      total: totalSignalements,
      icon: '📋',
      color: 'bg-blue-500',
      href: '/admin/signalements',
    },
    {
      label: 'Projets en cours',
      value: activeProjets,
      total: totalProjets,
      icon: '🏗',
      color: 'bg-emerald-500',
      href: '/admin/projets',
    },
    {
      label: "Taux d'avancement moyen",
      value: `${avgRate}%`,
      total: null,
      icon: '📈',
      color: 'bg-purple-500',
      href: '/admin/projets',
    },
    ...(totalCitizens !== null
      ? [{
          label: 'Citoyens inscrits',
          value: totalCitizens,
          total: null,
          icon: '👥',
          color: 'bg-amber-500',
          href: null,
        }]
      : []),
  ]

  const byCategory = signalementsByCategory.map((r) => ({ category: r.category, count: r._count.id }))
  const byStatus = signalementsByStatus.map((r) => ({ status: r.status, count: r._count.id }))

  return (
    <div className="p-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {ROLE_LABELS[session.role as Role]}
          {session.wilaya ? ` — Wilaya de ${session.wilaya}` : ''}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map(({ label, value, total, icon, color, href }) => {
          const card = (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-4`}>
                {icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {total !== null && (
                <p className="text-xs text-gray-400 mt-0.5">sur {total} total</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          )
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          )
        })}
      </div>

      {/* Average advancement KPI banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100">Taux d'avancement moyen — Projets PAW</p>
            <p className="text-4xl font-bold mt-1">{avgRate}%</p>
            <p className="text-sm text-emerald-200 mt-1">
              {totalProjets} projet{totalProjets > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="w-24 h-24 relative">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#ffffff20" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.91"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeDasharray={`${avgRate} ${100 - avgRate}`}
                strokeLinecap="round"
                strokeDashoffset="0"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {avgRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts byCategory={byCategory} byStatus={byStatus} />

      {/* Recent signalements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Signalements récents</h3>
          <Link href="/admin/signalements" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentSignalements.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun signalement</p>
          ) : (
            recentSignalements.map((s) => (
              <div key={s.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s.citizen.name} · {new Date(s.createdAt).toLocaleDateString('fr-DZ')}
                  </p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium border ${
                  s.status === 'RECU' ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : s.status === 'EN_COURS' ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : s.status === 'RESOLU' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {s.status === 'RECU' ? 'Reçu'
                    : s.status === 'EN_COURS' ? 'En cours'
                    : s.status === 'RESOLU' ? 'Résolu'
                    : s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
