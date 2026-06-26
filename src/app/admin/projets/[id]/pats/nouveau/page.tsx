'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createPAT, type PATFormState } from '@/app/actions/pats'

export default function NouveauPATPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [state, action, pending] = useActionState<PATFormState, FormData>(createPAT, undefined)

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/projets" className="hover:text-gray-700 transition-colors">
          Projets
        </Link>
        <span>›</span>
        <Link href={`/admin/projets/${projectId}/pats`} className="hover:text-gray-700 transition-colors">
          PATs
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Nouveau PAT</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Créer un PAT</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plan d&apos;Aménagement du Territoire rattaché à ce projet.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form action={action} className="space-y-5">
          <input type="hidden" name="projectId" value={projectId} />

          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nom du PAT <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              minLength={3}
              maxLength={200}
              autoFocus
              placeholder="Ex: PAT Urbanisme 2025"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {pending ? 'Création…' : 'Créer le PAT'}
            </button>
            <Link
              href={`/admin/projets/${projectId}/pats`}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
