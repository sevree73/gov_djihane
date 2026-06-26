'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { updatePATLocation } from '@/app/actions/pats'

const WilayaLocationPicker = dynamic(() => import('./WilayaLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

interface Props {
  patId: string
  wilaya: string | null | undefined
  initialLat?: number | null
  initialLng?: number | null
}

export default function PATLocationSection({ patId, wilaya, initialLat, initialLng }: Props) {
  const hasInitial = initialLat != null && initialLng != null
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    hasInitial ? { lat: initialLat!, lng: initialLng! } : null,
  )
  const [showPicker, setShowPicker] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function save() {
    if (!location) return
    const fd = new FormData()
    fd.set('patId', patId)
    fd.set('lat', String(location.lat))
    fd.set('lng', String(location.lng))
    startTransition(async () => {
      await updatePATLocation(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Localisation du PAT</h3>
          {wilaya && <p className="text-xs text-gray-400 mt-0.5">Wilaya : {wilaya}</p>}
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
        <div className="h-56 rounded-xl overflow-hidden border border-gray-200 mb-3">
          <WilayaLocationPicker
            wilaya={wilaya}
            initial={location}
            onSelect={(pt) => { setLocation(pt); setShowPicker(false) }}
          />
        </div>
      )}

      {location && (
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
        >
          {isPending ? (
            <>
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement…
            </>
          ) : saved ? (
            '✓ Localisation enregistrée'
          ) : (
            'Enregistrer la localisation'
          )}
        </button>
      )}
    </div>
  )
}
