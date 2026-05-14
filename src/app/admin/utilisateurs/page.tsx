import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import UsersTable from '@/components/admin/UsersTable'
import { ALGERIAN_WILAYAS } from '@/lib/constants'
import type { Role } from '@/types'

const PER_PAGE = 20

export default async function UtilisateursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; wilaya?: string; page?: string }>
}) {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') redirect('/admin/dashboard')

  const params = await searchParams
  const q = params.q?.trim() || undefined
  const wilaya = params.wilaya || undefined
  const page = Math.max(1, parseInt(params.page ?? '1'))

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(wilaya ? { wilaya } : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        wilaya: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { q, wilaya, page: String(page), ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v)
    }
    return `/admin/utilisateurs?${p.toString()}`
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total} utilisateur{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search form */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Rechercher par nom ou email…"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          name="wilaya"
          defaultValue={wilaya ?? ''}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">— Toutes les wilayas —</option>
          {ALGERIAN_WILAYAS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          Rechercher
        </button>
        {(q || wilaya) && (
          <a
            href="/admin/utilisateurs"
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* Table + modal state managed client-side */}
      <UsersTable
        users={users.map((u) => ({ ...u, role: u.role as Role }))}
        sessionUserId={session.userId}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildHref({ page: String(page - 1) })}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Précédent
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildHref({ page: String(page + 1) })}
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
