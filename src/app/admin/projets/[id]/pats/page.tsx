import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'

function computeAvancement(actions: { status: string }[]): number {
  if (actions.length === 0) return 0
  const done = actions.filter((a) => a.status === 'DONE').length
  return Math.round((done / actions.length) * 100)
}

function computeAlerts(actions: { status: string }[]): number {
  return actions.filter((a) => a.status === 'RETARD').length
}

export default async function PATListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      wilaya: true,
      pats: {
        include: { actions: { select: { status: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) notFound()

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/projets" className="hover:text-gray-700 transition-colors">
          Projets
        </Link>
        <span>›</span>
        <span className="text-gray-700 truncate max-w-[220px]">{project.title}</span>
        <span>›</span>
        <span className="text-gray-900 font-medium">PATs</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans d&apos;Aménagement du Territoire</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {project.title}
            {project.wilaya ? ` — ${project.wilaya}` : ''}
          </p>
        </div>
        <Link
          href={`/admin/projets/${id}/pats/nouveau`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau PAT
        </Link>
      </div>

      {/* PAT list */}
      {project.pats.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-20">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-gray-600">Aucun PAT pour ce projet</p>
          <p className="text-sm text-gray-400 mt-1">Créez le premier plan d&apos;aménagement.</p>
          <Link
            href={`/admin/projets/${id}/pats/nouveau`}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Créer un PAT
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {project.pats.map((pat) => {
            const avancement = computeAvancement(pat.actions)
            const alerts = computeAlerts(pat.actions)
            const done = pat.actions.filter((a) => a.status === 'DONE').length
            const enCours = pat.actions.filter((a) => a.status === 'EN_COURS').length
            const retard = pat.actions.filter((a) => a.status === 'RETARD').length

            return (
              <Link
                key={pat.id}
                href={`/admin/projets/${id}/pats/${pat.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{pat.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pat.actions.length} action{pat.actions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {alerts > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {alerts} en retard
                      </span>
                    )}
                    <span className="text-xs text-blue-600 font-medium">Voir →</span>
                  </div>
                </div>

                {/* Avancement bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Avancement</span>
                    <span className="text-xs font-bold text-gray-700">{avancement}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all bg-blue-500"
                      style={{ width: `${avancement}%` }}
                    />
                  </div>
                </div>

                {/* Status pills */}
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-600 font-medium">{done} achevées</span>
                  <span className="text-blue-600 font-medium">{enCours} en cours</span>
                  {retard > 0 && <span className="text-red-600 font-medium">{retard} en retard</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
