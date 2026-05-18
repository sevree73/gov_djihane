'use client'

import { useActionState } from 'react'
import { updateConsultationMeta, type UpdateConsultationState } from '@/app/actions/consultations'

type Props = {
  id: string
  title: string
  description: string
}

export default function ConsultationEditForm({ id, title, description }: Props) {
  const [state, action, pending] = useActionState<UpdateConsultationState, FormData>(
    updateConsultationMeta,
    undefined,
  )

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={id} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-sm text-emerald-700">Modifications enregistrées.</p>
        </div>
      )}

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
          defaultValue={title}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          defaultValue={description}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none resize-none transition"
        />
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </form>
  )
}
