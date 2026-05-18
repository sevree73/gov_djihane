'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { GeoPoint } from '@/types'
import { SIGNALEMENT_CATEGORIES } from '@/lib/constants'
import { ALGERIAN_WILAYAS } from '@/lib/constants'

const ImageUploader = dynamic(() => import('@/components/citizen/ImageUploader'), {
  ssr: false,
  loading: () => <div className="h-10 bg-gray-700/50 rounded-lg animate-pulse" />,
})

interface SignalementPanelProps {
  point: GeoPoint
  defaultWilaya?: string | null
  onClose: () => void
  onSuccess: (id: string) => void
}

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function SignalementPanel({ point, defaultWilaya, onClose, onSuccess }: SignalementPanelProps) {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [wilaya, setWilaya] = useState(defaultWilaya ?? '')

  useEffect(() => { setWilaya(defaultWilaya ?? '') }, [defaultWilaya])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('submitting')
    setErrorMsg('')

    if (mediaUrls.length === 0) {
      setFormState('error')
      setErrorMsg('Veuillez ajouter au moins une photo du problème.')
      return
    }

    const fd = new FormData(e.currentTarget)
    const payload = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      category: fd.get('category') as string,
      wilaya: (fd.get('wilaya') as string) || undefined,
      lng: point.lng,
      lat: point.lat,
      mediaUrls,
    }

    try {
      const res = await fetch('/api/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erreur inconnue')
      }

      const { id } = await res.json()
      setFormState('success')
      onSuccess(id)
    } catch (err) {
      setFormState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-[1000] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-800">
        <div>
          <h2 className="text-white font-semibold text-base">Signaler un problème</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* GPS indicator */}
      <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg">
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-emerald-300">Position capturée sur la carte</span>
      </div>

      {formState === 'success' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Signalement envoyé</p>
            <p className="text-sm text-gray-400 mt-1">
              Votre signalement a été transmis. Vous serez notifié de son avancement.
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {formState === 'error' && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3">
              <p className="text-sm text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              name="category"
              required
              defaultValue=""
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
            >
              <option value="" disabled>Sélectionner une catégorie</option>
              {Object.entries(SIGNALEMENT_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              minLength={5}
              maxLength={120}
              placeholder="Décrivez le problème en quelques mots"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              placeholder="Décrivez le problème en détail…"
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none transition"
            />
          </div>

          {/* Wilaya */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Wilaya
              {wilaya && (
                <span className="ml-2 text-xs text-emerald-400 font-normal">détectée automatiquement</span>
              )}
            </label>
            <select
              name="wilaya"
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
            >
              <option value="">— Optionnel —</option>
              {ALGERIAN_WILAYAS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Photos <span className="text-red-400">*</span>
              <span className="text-xs font-normal text-gray-500 ml-1">(max 3, obligatoire)</span>
            </label>
            <ImageUploader onUploadComplete={setMediaUrls} maxFiles={3} />
          </div>

          <div className="pt-2 pb-4">
            <button
              type="submit"
              disabled={formState === 'submitting'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {formState === 'submitting' ? 'Envoi en cours…' : 'Envoyer le signalement'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
