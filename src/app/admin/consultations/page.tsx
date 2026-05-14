import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import {
  publishConsultation,
  closeConsultation,
} from '@/app/actions/consultations'

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée',
  CLOTUREE: 'Clôturée',
}

const STATUS_CLASSES: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  PUBLIEE: 'bg-emerald-100 text-emerald-700',
  CLOTUREE: 'bg-red-100 text-red-600',
}

export default async function ConsultationsPage() {
  await requireAdmin()

  const consultations = await prisma.consultation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, title: true } },
      publishedBy: { select: { name: true } },
      _count: { select: { questions: true, votes: true } },
    },
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultations publiques</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {consultations.length} consultation{consultations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/consultations/nouveau"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle consultation
        </Link>
      </div>

      {/* List */}
      {consultations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-4xl mb-3">🗳</p>
          <p className="font-medium text-gray-600">Aucune consultation</p>
          <p className="text-sm text-gray-400 mt-1">
            Créez votre première consultation pour recueillir l&apos;avis des citoyens.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-base font-semibold text-gray-900">{c.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASSES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{c.description}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                    {c.project && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {c.project.title}
                      </span>
                    )}
                    <span>{c._count.questions} question{c._count.questions > 1 ? 's' : ''}</span>
                    <span>{c._count.votes} réponse{c._count.votes > 1 ? 's' : ''}</span>
                    <span>Par {c.publishedBy.name}</span>
                    <span>
                      {new Date(c.createdAt).toLocaleDateString('fr-DZ', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    {c.closedAt && (
                      <span className="text-red-400">
                        Clôturée le {new Date(c.closedAt).toLocaleDateString('fr-DZ', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {c.status === 'BROUILLON' && (
                    <form action={publishConsultation}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Publier
                      </button>
                    </form>
                  )}
                  {c.status === 'PUBLIEE' && (
                    <form action={closeConsultation}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        Clôturer
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
