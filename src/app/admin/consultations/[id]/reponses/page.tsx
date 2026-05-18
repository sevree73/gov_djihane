import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import {
  deleteConsultationResponse,
  addAdminConsultationComment,
} from '@/app/actions/consultations'

const VOTE_LABELS: Record<number, string> = { 1: 'Pour', 0: 'Neutre', [-1]: 'Contre' }
const VOTE_CLASSES: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  0: 'bg-gray-100 text-gray-600',
  [-1]: 'bg-red-100 text-red-600',
}

export default async function ReponsesConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [consultation, votes, allAnswers, adminComments] = await Promise.all([
    prisma.consultation.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    }),
    prisma.vote.findMany({
      where: { consultationId: id },
      include: { user: { select: { id: true, name: true, email: true, wilaya: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.questionAnswer.findMany({
      where: { question: { consultationId: id } },
      include: { question: { select: { id: true, text: true, order: true } } },
    }),
    prisma.comment.findMany({
      where: { consultationId: id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!consultation) notFound()

  // Group answers by userId
  const answersByUser = new Map<string, typeof allAnswers>()
  for (const answer of allAnswers) {
    const list = answersByUser.get(answer.userId) ?? []
    list.push(answer)
    answersByUser.set(answer.userId, list)
  }

  const forCount = votes.filter((v) => v.value === 1).length
  const neutralCount = votes.filter((v) => v.value === 0).length
  const againstCount = votes.filter((v) => v.value === -1).length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/consultations" className="hover:text-gray-700 transition-colors">
          Consultations
        </Link>
        <span>›</span>
        <Link
          href={`/admin/consultations/${id}/modifier`}
          className="hover:text-gray-700 transition-colors truncate max-w-[200px]"
        >
          {consultation.title}
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Réponses</span>
      </nav>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réponses citoyennes</h1>
          <p className="text-sm text-gray-500 mt-1">{consultation.title}</p>
        </div>
        <Link
          href={`/admin/consultations/${id}/modifier`}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Modifier
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{votes.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Participants</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{forCount}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Pour</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{neutralCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Neutre</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{againstCount}</p>
          <p className="text-xs text-red-500 mt-0.5">Contre</p>
        </div>
      </div>

      {/* Admin comments / replies */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Commentaires officiels</h2>
        <p className="text-xs text-gray-400 mb-4">
          Ces commentaires sont visibles publiquement sur la page de la consultation.
        </p>

        {adminComments.length > 0 && (
          <div className="space-y-3 mb-4">
            {adminComments.map((c) => (
              <div key={c.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-800">{c.author.name}</span>
                  <span className="text-xs text-blue-400">
                    {new Date(c.createdAt).toLocaleDateString('fr-DZ', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        <form action={addAdminConsultationComment} className="flex gap-2">
          <input type="hidden" name="consultationId" value={id} />
          <input
            type="text"
            name="content"
            required
            maxLength={1000}
            placeholder="Ajouter un commentaire ou une réponse officielle…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Publier
          </button>
        </form>
      </div>

      {/* Individual responses */}
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Réponses individuelles
        <span className="ml-2 text-xs text-gray-400 font-normal">{votes.length} réponse{votes.length !== 1 ? 's' : ''}</span>
      </h2>

      {votes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16">
          <p className="text-4xl mb-3">🗳</p>
          <p className="font-medium text-gray-600">Aucune réponse pour l&apos;instant</p>
          <p className="text-sm text-gray-400 mt-1">Les réponses des citoyens apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {votes.map((v) => {
            const userAnswers = (answersByUser.get(v.userId) ?? []).sort(
              (a, b) => a.question.order - b.question.order,
            )
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* User info + vote badge */}
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                        {v.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{v.user.name}</p>
                        <p className="text-xs text-gray-400">{v.user.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${VOTE_CLASSES[v.value] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {VOTE_LABELS[v.value] ?? `Vote ${v.value}`}
                      </span>
                      {v.user.wilaya && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {v.user.wilaya}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(v.createdAt).toLocaleDateString('fr-DZ', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Question answers */}
                    {userAnswers.length > 0 && (
                      <div className="space-y-2 pl-12">
                        {userAnswers.map((a) => (
                          <div key={a.id}>
                            <p className="text-xs font-medium text-gray-500 mb-0.5">{a.question.text}</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                              {a.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {userAnswers.length === 0 && consultation.questions.length > 0 && (
                      <p className="text-xs text-gray-400 italic pl-12">Aucune réponse aux questions.</p>
                    )}
                  </div>

                  {/* Delete response */}
                  <form action={deleteConsultationResponse}>
                    <input type="hidden" name="voteId" value={v.id} />
                    <input type="hidden" name="consultationId" value={id} />
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer cette réponse"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
