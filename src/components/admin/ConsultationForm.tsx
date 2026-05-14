'use client'

import { useActionState, useState } from 'react'
import { createConsultation, type ConsultationFormState } from '@/app/actions/consultations'

export default function ConsultationForm() {
  const [questions, setQuestions] = useState<string[]>([''])
  const [state, action, pending] = useActionState<ConsultationFormState, FormData>(
    createConsultation,
    undefined,
  )

  function addQuestion() {
    if (questions.length >= 10) return
    setQuestions((prev) => [...prev, ''])
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateQuestion(idx: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? value : q)))
  }

  return (
    <form action={action} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          minLength={5}
          maxLength={200}
          placeholder="Ex: Consultation sur le nouveau plan d'urbanisme"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          placeholder="Décrivez l'objet de cette consultation et son contexte…"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none resize-none transition"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Statut initial
        </label>
        <select
          name="status"
          defaultValue="BROUILLON"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="BROUILLON">Brouillon (non visible par les citoyens)</option>
          <option value="PUBLIEE">Publier immédiatement</option>
        </select>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">
            Questions <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {questions.length}/10
            </span>
          </label>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    Question {idx + 1}
                  </span>
                </div>
                <textarea
                  name={`question_${idx}`}
                  value={q}
                  onChange={(e) => updateQuestion(idx, e.target.value)}
                  required
                  maxLength={500}
                  rows={2}
                  placeholder="Posez votre question aux citoyens…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none transition"
                />
              </div>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(idx)}
                  className="mt-6 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {questions.length < 10 && (
          <button
            type="button"
            onClick={addQuestion}
            className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une question
          </button>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pending ? 'Création en cours…' : 'Créer la consultation'}
        </button>
        <a
          href="/admin/consultations"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Annuler
        </a>
      </div>
    </form>
  )
}
