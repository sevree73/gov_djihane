import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export default async function ConsultationsPage() {
  const session = await getSession()

  const consultations = await prisma.consultation.findMany({
    where: { status: 'PUBLIEE' },
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, title: true } },
      _count: { select: { questions: true, votes: true } },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-semibold text-gray-800">Consultations publiques</h1>
        </div>
        {!session && (
          <Link
            href="/connexion"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Se connecter
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Donnez votre avis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Participez aux consultations publiques en cours et contribuez aux décisions territoriales.
          </p>
        </div>

        {consultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
            <p className="text-4xl mb-3">🗳</p>
            <p className="font-medium text-gray-600">Aucune consultation en cours</p>
            <p className="text-sm text-gray-400 mt-1">
              Revenez prochainement pour participer aux consultations.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                      {c.project && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                          </svg>
                          {c.project.title}
                        </span>
                      )}
                      <span>{c._count.questions} question{c._count.questions > 1 ? 's' : ''}</span>
                      <span>{c._count.votes} participant{c._count.votes > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/consultations/${c.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Participer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
