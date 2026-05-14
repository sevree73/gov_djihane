import { Suspense } from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ProjetStatusBadge from '@/components/admin/ProjetStatusBadge'
import AdvancementBar from '@/components/admin/AdvancementBar'
import ProjetsFilter from '@/components/admin/ProjetsFilter'
import type { Role } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; wilaya?: string; page?: string }>
}) {
  const session = await requireAdmin()
  const params = await searchParams

  const statusFilter = params.status || undefined
  const wilayaFilter = params.wilaya || undefined
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const perPage = 25

  const scopedWilaya =
    WILAYA_ROLES.includes(session.role as Role) ? session.wilaya : undefined

  const where = {
    ...(scopedWilaya ? { wilaya: scopedWilaya } : wilayaFilter ? { wilaya: wilayaFilter } : {}),
    ...(statusFilter ? { status: statusFilter as never } : {}),
  }

  const [projets, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.project.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)
  const canCreate = !WILAYA_ROLES.includes(session.role as Role) || session.role === 'ADMIN_WILAYA' || session.role === 'GESTIONNAIRE_TERRITORIAL'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets Territoriaux (PAW)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} projet{total > 1 ? 's' : ''}
            {scopedWilaya ? ` — Wilaya de ${scopedWilaya}` : ''}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/projets/nouveau"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau projet
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-[58px] bg-white rounded-xl border border-gray-100 animate-pulse" />}>
          <ProjetsFilter />
        </Suspense>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {projets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏗</p>
            <p className="font-medium text-gray-600">Aucun projet</p>
            <p className="text-sm mt-1">Créez le premier projet territorial.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Titre', 'Secteur', 'Statut', 'Avancement', 'Wilaya', 'Dates', 'Créé par', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {projets.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 max-w-[220px] truncate">{p.title}</p>
                      {p.ministere && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{p.ministere}</p>
                      )}
                      <Link href={`/admin/projets/${p.id}/modifier`} className="text-xs text-blue-600 hover:underline mt-0.5 block">
                        Modifier →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.sector}</td>
                    <td className="px-4 py-3">
                      <ProjetStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <AdvancementBar rate={p.advancementRate} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.wilaya ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.startDate
                        ? new Date(p.startDate).toLocaleDateString('fr-DZ', { month: 'short', year: 'numeric' })
                        : '—'}
                      {p.endDate
                        ? ` → ${new Date(p.endDate).toLocaleDateString('fr-DZ', { month: 'short', year: 'numeric' })}`
                        : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.createdBy.name}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/projets/${p.id}/modifier`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/projets?status=${statusFilter ?? ''}&page=${page - 1}`}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Précédent
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/projets?status=${statusFilter ?? ''}&page=${page + 1}`}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Suivant →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
