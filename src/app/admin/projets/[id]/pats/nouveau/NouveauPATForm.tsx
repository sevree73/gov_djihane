'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createPAT, type PATFormState } from '@/app/actions/pats'
import type { GeoPoint } from '@/types'

const WilayaLocationPicker = dynamic(() => import('@/components/admin/WilayaLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

type DraftAction = { text: string; deadline: string }

interface Props {
  projectId: string
  wilaya: string | null
}

export default function NouveauPATForm({ projectId, wilaya }: Props) {
  const [state, action, pending] = useActionState<PATFormState, FormData>(createPAT, undefined)
  const [actions, setActions] = useState<DraftAction[]>([{ text: '', deadline: '' }])
  const [location, setLocation] = useState<GeoPoint | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  function addAction() {
    setActions((prev) => [...prev, { text: '', deadline: '' }])
  }

  function removeAction(idx: number) {
    setActions((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateAction(idx: number, field: keyof DraftAction, value: string) {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)))
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="lat" value={location?.lat ?? ''} />
      <input type="hidden" name="lng" value={location?.lng ?? ''} />

      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Informations générales</h2>
        <div className="space-y-4">
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
              placeholder="Ex: PAT Urbanisme Nord 2025"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition"
            />
            {wilaya && (
              <p className="mt-1.5 text-xs text-gray-400">
                Wilaya héritée du projet : <span className="font-medium text-gray-600">{wilaya}</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Avancement (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                name="avancement"
                type="number"
                min={0}
                max={100}
                defaultValue={0}
                className="w-24 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-center focus:border-blue-500 focus:outline-none transition"
              />
              <span className="text-sm text-gray-400">sur 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Localisation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Optionnel — positionnez le PAT dans sa wilaya</p>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {showPicker ? 'Masquer la carte' : location ? 'Modifier la position' : 'Choisir sur la carte'}
          </button>
        </div>

        {location && !showPicker && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg mb-3">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-blue-700">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
            <button type="button" onClick={() => setLocation(null)} className="ml-auto text-blue-400 hover:text-blue-600">✕</button>
          </div>
        )}

        {showPicker && (
          <div className="h-64 rounded-xl overflow-hidden border border-gray-300">
            <WilayaLocationPicker
              wilaya={wilaya}
              initial={location}
              onSelect={(pt) => { setLocation(pt); setShowPicker(false) }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Actions</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {actions.length} action{actions.length !== 1 ? 's' : ''} — statut initial : En cours
            </p>
          </div>
          <button
            type="button"
            onClick={addAction}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une action
          </button>
        </div>

        <div className="space-y-3">
          {actions.map((a, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
              <div className="w-6 h-6 mt-2 shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {idx + 1}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Intitulé</label>
                  <input
                    name={`action_text_${idx}`}
                    type="text"
                    value={a.text}
                    onChange={(e) => updateAction(idx, 'text', e.target.value)}
                    maxLength={500}
                    placeholder="Décrire l'action…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Échéance</label>
                  <input
                    name={`action_deadline_${idx}`}
                    type="date"
                    value={a.deadline}
                    onChange={(e) => updateAction(idx, 'deadline', e.target.value)}
                    min={today}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              {actions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAction(idx)}
                  className="mt-7 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        <button
          type="button"
          onClick={addAction}
          className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une action
        </button>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
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
  )
}
