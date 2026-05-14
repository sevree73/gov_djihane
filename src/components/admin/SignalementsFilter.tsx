'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'RECU', label: 'Reçu' },
  { value: 'EN_COURS', label: 'En cours' },
  { value: 'PRIS_EN_CHARGE', label: 'Pris en charge' },
  { value: 'RESOLU', label: 'Résolu' },
  { value: 'REJETE', label: 'Rejeté' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'URBANISME', label: 'Urbanisme' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ENVIRONNEMENT', label: 'Environnement' },
  { value: 'VOIRIE', label: 'Voirie' },
  { value: 'EAU', label: 'Eau' },
  { value: 'DECHETS', label: 'Déchets' },
  { value: 'EQUIPEMENTS_PUBLICS', label: 'Équipements publics' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'EDUCATION', label: 'Éducation' },
]

const SELECT_CLASS =
  'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 font-medium ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors ' +
  'hover:border-gray-400 cursor-pointer'

export default function SignalementsFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const status = params.get('status') ?? ''
  const category = params.get('category') ?? ''
  const hasFilter = !!(status || category)

  function navigate(updates: Record<string, string>) {
    const p = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    p.delete('page')
    startTransition(() => router.push(`/admin/signalements?${p.toString()}`))
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100 transition-opacity duration-200 ${
        isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      <select
        value={status}
        onChange={(e) => navigate({ status: e.target.value })}
        className={SELECT_CLASS}
        aria-label="Filtrer par statut"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => navigate({ category: e.target.value })}
        className={SELECT_CLASS}
        aria-label="Filtrer par catégorie"
      >
        {CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {isPending && (
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Chargement…
        </span>
      )}

      {hasFilter && !isPending && (
        <button
          type="button"
          onClick={() => navigate({ status: '', category: '' })}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Réinitialiser
        </button>
      )}
    </div>
  )
}
