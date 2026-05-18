import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import ConsultationEditForm from '@/components/admin/ConsultationEditForm'
import {
  deleteConsultationQuestion,
  addConsultationQuestion,
} from '@/app/actions/consultations'

export default async function ModifierConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: 'asc' } } },
  })

  if (!consultation) notFound()

  const questionCount = consultation.questions.length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/consultations" className="hover:text-gray-700 transition-colors">
          Consultations
        </Link>
        <span>›</span>
        <span className="text-gray-700 truncate max-w-[200px]">{consultation.title}</span>
        <span>›</span>
        <span className="text-gray-900 font-medium">Modifier</span>
      </nav>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modifier la consultation</h1>
          <p className="text-sm text-gray-500 mt-1">{consultation.title}</p>
        </div>
        <Link
          href={`/admin/consultations/${id}/reponses`}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Voir les réponses
        </Link>
      </div>

      {/* Meta form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Informations générales</h2>
        <ConsultationEditForm
          id={id}
          title={consultation.title}
          description={consultation.description}
        />
      </div>

      {/* Questions management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Questions
          <span className="ml-2 text-xs text-gray-400 font-normal">
            {questionCount}/10
          </span>
        </h2>

        <div className="space-y-3 mb-6">
          {questionCount === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune question pour l&apos;instant.</p>
          ) : (
            consultation.questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="mt-0.5 shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  {idx + 1}
                </span>
                <p className="flex-1 text-sm text-gray-800 leading-relaxed">{q.text}</p>
                <form action={deleteConsultationQuestion}>
                  <input type="hidden" name="questionId" value={q.id} />
                  <input type="hidden" name="consultationId" value={id} />
                  <button
                    type="submit"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer cette question"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        {questionCount < 10 && (
          <form action={addConsultationQuestion} className="flex gap-2">
            <input type="hidden" name="consultationId" value={id} />
            <input
              type="text"
              name="text"
              required
              maxLength={500}
              placeholder="Nouvelle question à ajouter…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter
            </button>
          </form>
        )}
        {questionCount >= 10 && (
          <p className="text-xs text-gray-400 italic">Maximum 10 questions atteint.</p>
        )}
      </div>
    </div>
  )
}
