import { Suspense } from 'react'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import SignalementTable from '@/components/admin/SignalementTable'
import SignalementsFilter from '@/components/admin/SignalementsFilter'
import type { Role } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export default async function SignalementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>
}) {
  const session = await requireAdmin()
  const params = await searchParams

  const statusFilter = params.status || undefined
  const categoryFilter = params.category || undefined
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const perPage = 30

  const wilayaFilter =
    WILAYA_ROLES.includes(session.role as Role) && session.wilaya
      ? { wilaya: session.wilaya }
      : {}

  const where = {
    ...wilayaFilter,
    ...(statusFilter ? { status: statusFilter as never } : {}),
    ...(categoryFilter ? { category: categoryFilter as never } : {}),
  }

  const [signalements, total] = await Promise.all([
    prisma.signalement.findMany({
      where,
      select: {
        id: true, title: true, description: true, category: true, status: true,
        wilaya: true, commune: true, createdAt: true, mediaUrls: true,
        citizen: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.signalement.count({ where }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signalements citoyens</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} signalement{total > 1 ? 's' : ''}
            {session.wilaya ? ` — Wilaya de ${session.wilaya}` : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-[58px] bg-white rounded-xl border border-gray-100 animate-pulse" />}>
          <SignalementsFilter />
        </Suspense>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <SignalementTable signalements={signalements as never} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/signalements?status=${statusFilter ?? ''}&category=${categoryFilter ?? ''}&page=${page - 1}`}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Précédent
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/signalements?status=${statusFilter ?? ''}&category=${categoryFilter ?? ''}&page=${page + 1}`}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
