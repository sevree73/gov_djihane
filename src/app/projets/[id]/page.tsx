import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import CommentSection from '@/components/citizen/CommentSection'
import { PROJECT_STATUSES } from '@/lib/constants'

const STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-100 text-gray-600',
  EN_COURS: 'bg-blue-100 text-blue-700',
  SUSPENDU: 'bg-amber-100 text-amber-700',
  TERMINE: 'bg-emerald-100 text-emerald-700',
  ANNULE: 'bg-red-100 text-red-600',
}

const ADVANCEMENT_COLORS: Record<string, string> = {
  EN_ATTENTE: '#9ca3af',
  EN_COURS: '#3b82f6',
  SUSPENDU: '#f59e0b',
  TERMINE: '#10b981',
  ANNULE: '#ef4444',
}

function formatBudget(budget: { toString(): string } | null): string {
  if (!budget) return '—'
  const n = parseFloat(budget.toString())
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} milliards DZD`
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} millions DZD`
  return `${n.toLocaleString('fr-DZ')} DZD`
}

export default async function ProjetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const [project, comments] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        consultations: {
          where: { status: 'PUBLIEE' },
          select: { id: true, title: true, _count: { select: { votes: true } } },
        },
      },
    }),
    prisma.comment.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { name: true } },
      },
    }),
  ])

  if (!project) notFound()

  const statusLabel = PROJECT_STATUSES[project.status as keyof typeof PROJECT_STATUSES] ?? project.status
  const statusClass = STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-600'
  const barColor = ADVANCEMENT_COLORS[project.status] ?? '#6b7280'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm text-gray-500">Carte</span>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-800 font-medium truncate">{project.title}</span>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Project card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {project.sector}
              </p>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{project.title}</h1>
            </div>
            <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          {/* Advancement */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-medium">Avancement</span>
              <span className="text-sm font-bold text-gray-800">{project.advancementRate}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${project.advancementRate}%`, background: barColor }}
              />
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            {project.wilaya && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Wilaya</p>
                <p className="font-medium text-gray-800">{project.wilaya}</p>
              </div>
            )}
            {(project.budget || project.budgetSpent) && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Budget</p>
                <p className="font-medium text-gray-800">{formatBudget(project.budget)}</p>
              </div>
            )}
            {project.startDate && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date de début</p>
                <p className="font-medium text-gray-800">
                  {new Date(project.startDate).toLocaleDateString('fr-DZ', {
                    month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
            {project.endDate && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Échéance</p>
                <p className="font-medium text-gray-800">
                  {new Date(project.endDate).toLocaleDateString('fr-DZ', {
                    month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Responsable</p>
              <p className="font-medium text-gray-800">{project.createdBy.name}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
              Description
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
        </div>

        {/* Related consultations */}
        {project.consultations.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Consultations ouvertes
            </h2>
            <div className="space-y-3">
              {project.consultations.map((c) => (
                <Link
                  key={c.id}
                  href={`/consultations/${c.id}`}
                  className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 hover:bg-emerald-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-emerald-800">{c.title}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {c._count.votes} participant{c._count.votes !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-emerald-600 text-sm font-medium">Participer →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comment section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <CommentSection
            projectId={id}
            comments={comments}
            canComment={!!session}
          />
        </div>
      </div>
    </div>
  )
}
