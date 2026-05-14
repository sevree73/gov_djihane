import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import ConsultationVoteForm from '@/components/citizen/ConsultationVoteForm'

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      project: { select: { id: true, title: true } },
      publishedBy: { select: { name: true } },
      _count: { select: { votes: true } },
    },
  })

  if (!consultation || consultation.status === 'BROUILLON') notFound()

  // Check if the current citizen already participated
  let hasParticipated = false
  let existingVote: number | null = null
  let existingAnswers: { questionId: string; value: string }[] = []

  if (session?.role === 'CITOYEN') {
    const vote = await prisma.vote.findUnique({
      where: {
        consultationId_userId: { consultationId: id, userId: session.userId },
      },
    })
    if (vote) {
      hasParticipated = true
      existingVote = vote.value
      const answers = await prisma.questionAnswer.findMany({
        where: { userId: session.userId, question: { consultationId: id } },
        select: { questionId: true, value: true },
      })
      existingAnswers = answers
    }
  }

  const isClosed = consultation.status === 'CLOTUREE'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/consultations" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm text-gray-500">Consultations</span>
        <span className="text-gray-300">›</span>
        <span className="text-sm text-gray-800 font-medium truncate">{consultation.title}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{consultation.title}</h1>
            {isClosed ? (
              <span className="shrink-0 text-xs px-3 py-1 bg-red-100 text-red-600 rounded-full font-medium">
                Clôturée
              </span>
            ) : (
              <span className="shrink-0 text-xs px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                En cours
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-4">{consultation.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            {consultation.project && (
              <Link
                href={`/projets/${consultation.project.id}`}
                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
                {consultation.project.title}
              </Link>
            )}
            <span>{consultation._count.votes} participant{consultation._count.votes !== 1 ? 's' : ''}</span>
            <span>{consultation.questions.length} question{consultation.questions.length !== 1 ? 's' : ''}</span>
            <span>
              Publiée le{' '}
              {new Date(consultation.createdAt).toLocaleDateString('fr-DZ', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Vote / participation form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">
            {hasParticipated
              ? 'Votre participation'
              : isClosed
              ? 'Consultation clôturée'
              : 'Participer'}
          </h2>

          {isClosed && !hasParticipated ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-600">
                Cette consultation est maintenant clôturée. La période de participation est terminée.
              </p>
            </div>
          ) : (
            <ConsultationVoteForm
              consultationId={id}
              questions={consultation.questions}
              hasParticipated={hasParticipated}
              existingVote={existingVote}
              existingAnswers={existingAnswers}
              isLoggedIn={session?.role === 'CITOYEN'}
            />
          )}
        </div>
      </div>
    </div>
  )
}
