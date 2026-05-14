'use client'

import { useActionState, useState } from 'react'
import dynamic from 'next/dynamic'
import { createProjet, type ProjetFormState } from '@/app/actions/projets'
import { ALGERIAN_WILAYAS, PROJECT_STATUSES } from '@/lib/constants'
import type { GeoPoint } from '@/types'

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

const SECTORS = [
  'Eau et Assainissement', 'Transport et Infrastructure', 'Éducation',
  'Santé', 'Logement', 'Agriculture', 'Énergie', 'Tourisme',
  'Industrie', 'Commerce', 'Environnement', 'Sport et Jeunesse',
  'Culture', 'Numérique', 'Autre',
]

export type ProjectInitialData = {
  title: string
  description: string
  sector: string
  status: string
  wilaya: string | null
  ministere: string | null
  budget: number | null
  budgetSpent: number | null
  advancementRate: number
  startDate: string | null  // YYYY-MM-DD
  endDate: string | null    // YYYY-MM-DD
}

interface ProjetFormProps {
  defaultWilaya?: string | null
  serverAction?: (prev: ProjetFormState, formData: FormData) => Promise<ProjetFormState>
  initialData?: ProjectInitialData
  initialLocation?: GeoPoint | null
}

export default function ProjetForm({
  defaultWilaya,
  serverAction,
  initialData,
  initialLocation,
}: ProjetFormProps) {
  const [state, action, pending] = useActionState<ProjetFormState, FormData>(
    serverAction ?? createProjet,
    undefined,
  )

  const [location, setLocation] = useState<GeoPoint | null>(initialLocation ?? null)
  const [showPicker, setShowPicker] = useState(false)

  const errors = (state as { errors?: Record<string, string[]> } | undefined)?.errors
  const general = (state as { general?: string } | undefined)?.general

  const isEdit = initialData !== undefined

  return (
    <form action={action} className="space-y-6">
      {general && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intitulé du projet <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={200}
            defaultValue={initialData?.title ?? ''}
            placeholder="Ex: Réhabilitation de la route nationale N°1…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {errors?.title && <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            required
            minLength={10}
            rows={4}
            defaultValue={initialData?.description ?? ''}
            placeholder="Décrivez les objectifs, le périmètre et les bénéficiaires du projet…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
          />
          {errors?.description && <p className="mt-1 text-xs text-red-600">{errors.description[0]}</p>}
        </div>

        {/* Sector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secteur <span className="text-red-500">*</span>
          </label>
          <select
            name="sector"
            required
            defaultValue={initialData?.sector ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="" disabled>Sélectionner un secteur</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors?.sector && <p className="mt-1 text-xs text-red-600">{errors.sector[0]}</p>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <select
            name="status"
            defaultValue={initialData?.status ?? 'EN_ATTENTE'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {Object.entries(PROJECT_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Wilaya */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wilaya</label>
          <select
            name="wilaya"
            defaultValue={initialData?.wilaya ?? defaultWilaya ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">— Toutes les wilayas —</option>
            {ALGERIAN_WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Ministere */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ministère (optionnel)</label>
          <input
            name="ministere"
            type="text"
            defaultValue={initialData?.ministere ?? ''}
            placeholder="Ex: Ministère des Transports"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget (DZD)</label>
          <input
            name="budget"
            type="number"
            min={0}
            step={1000000}
            defaultValue={initialData?.budget ?? ''}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors?.budget && <p className="mt-1 text-xs text-red-600">{errors.budget[0]}</p>}
        </div>

        {/* Budget spent */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget consommé (DZD)</label>
          <input
            name="budgetSpent"
            type="number"
            min={0}
            step={1000000}
            defaultValue={initialData?.budgetSpent ?? ''}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Advancement rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taux d'avancement (%)
          </label>
          <input
            name="advancementRate"
            type="number"
            min={0}
            max={100}
            defaultValue={initialData?.advancementRate ?? 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          {errors?.advancementRate && (
            <p className="mt-1 text-xs text-red-600">{errors.advancementRate[0]}</p>
          )}
        </div>

        {/* Start date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
          <input
            name="startDate"
            type="date"
            defaultValue={initialData?.startDate ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* End date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin prévue</label>
          <input
            name="endDate"
            type="date"
            defaultValue={initialData?.endDate ?? ''}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Location picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Localisation géographique (optionnel)
          </label>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {showPicker ? 'Masquer la carte' : location ? 'Modifier la position' : 'Choisir sur la carte'}
          </button>
        </div>

        {location && !showPicker && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-blue-700">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
            <button
              type="button"
              onClick={() => setLocation(null)}
              className="ml-auto text-blue-400 hover:text-blue-600"
            >
              ✕
            </button>
          </div>
        )}

        {showPicker && (
          <div className="h-64 rounded-xl overflow-hidden border border-gray-300">
            <LocationPicker
              onSelect={(pt) => { setLocation(pt); setShowPicker(false) }}
              initial={location}
            />
          </div>
        )}

        {/* Hidden inputs for lat/lng */}
        <input type="hidden" name="lat" value={location?.lat ?? ''} />
        <input type="hidden" name="lng" value={location?.lng ?? ''} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <a
          href="/admin/projets"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </a>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
        >
          {pending
            ? (isEdit ? 'Enregistrement…' : 'Création en cours…')
            : (isEdit ? 'Enregistrer les modifications' : 'Créer le projet')}
        </button>
      </div>
    </form>
  )
}
