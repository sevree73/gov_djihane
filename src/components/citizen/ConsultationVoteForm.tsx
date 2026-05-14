'use client'

import { useActionState, useState } from 'react'
import { submitParticipation, type ParticipationState } from '@/app/actions/consultations'

type Question = { id: string; text: string }

interface Props {
  consultationId: string
  questions: Question[]
  hasParticipated: boolean
  existingVote: number | null
  existingAnswers: { questionId: string; value: string }[]
  isLoggedIn: boolean
}

const VOTE_OPTIONS = [
  { value: 1,  label: 'Pour',   color: 'emerald', icon: '✓' },
  { value: 0,  label: 'Neutre', color: 'gray',    icon: '—' },
  { value: -1, label: 'Contre', color: 'red',     icon: '✗' },
]

const VOTE_LABEL: Record<string, string> = { '1': 'Pour', '0': 'Neutre', '-1': 'Contre' }

function voteBadgeClass(v: number) {
  if (v === 1) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (v === -1) return 'bg-red-100 text-red-600 border-red-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

export default function ConsultationVoteForm({
  consultationId,
  questions,
  hasParticipated,
  existingVote,
  existingAnswers,
  isLoggedIn,
}: Props) {
  const [selectedVote, setSelectedVote] = useState<number | null>(null)
  const [state, action, pending] = useActionState<ParticipationState, FormData>(
    submitParticipation,
    undefined,
  )

  // Show participation summary if already voted or just submitted
  if (hasParticipated || state?.success) {
    const voteVal = existingVote ?? selectedVote
    const answerMap = Object.fromEntries(existingAnswers.map((a) => [a.questionId, a.value]))

    return (
      <div className="space-y-6">
        {/* Thank-you banner */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Merci pour votre participation !</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Votre contribution a été enregistrée.
            </p>
          </div>
        </div>

        {/* Your vote */}
        {voteVal !== null && (
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
              Votre position
            </p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium ${voteBadgeClass(voteVal)}`}>
              {VOTE_LABEL[String(voteVal)] ?? '—'}
            </span>
          </div>
        )}

        {/* Your answers */}
        {questions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
              Vos réponses
            </p>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {i + 1}. {q.text}
                  </p>
                  {answerMap[q.id] ? (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 italic">
                      {answerMap[q.id]}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Pas de réponse</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-gray-600">
          <a href="/connexion" className="text-emerald-600 hover:underline font-medium">
            Connectez-vous
          </a>{' '}
          pour voter et répondre aux questions.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="consultationId" value={consultationId} />
      <input type="hidden" name="vote" value={selectedVote ?? ''} />

      {/* Vote */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-3">
          Votre position <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-3">
          {VOTE_OPTIONS.map((opt) => {
            const active = selectedVote === opt.value
            const baseClass = 'flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer select-none'
            const colorClass = active
              ? opt.color === 'emerald'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : opt.color === 'red'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-500 bg-gray-100 text-gray-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedVote(opt.value)}
                className={`${baseClass} ${colorClass}`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm font-semibold text-gray-800">
            Questions ({questions.length})
            <span className="ml-2 text-xs font-normal text-gray-400">Réponses optionnelles</span>
          </p>
          {questions.map((q, i) => (
            <div key={q.id}>
              <label
                htmlFor={`answer-${q.id}`}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {i + 1}. {q.text}
              </label>
              <textarea
                id={`answer-${q.id}`}
                name={`answer_${q.id}`}
                rows={3}
                maxLength={500}
                placeholder="Votre réponse (optionnel)…"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none transition"
              />
            </div>
          ))}
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || selectedVote === null}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {pending ? 'Envoi en cours…' : 'Soumettre ma participation'}
      </button>
    </form>
  )
}
