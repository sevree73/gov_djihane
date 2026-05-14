'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import type { GeoPoint, SignalementMarker } from '@/types'
import type { ProjectMarkerData } from './LeafletMap'
import SignalementPanel from './SignalementPanel'
import ProjectDrawer from './ProjectDrawer'
import { ALGERIAN_WILAYAS } from '@/lib/constants'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-800">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Chargement de la carte…</p>
      </div>
    </div>
  ),
})

type MapMode = 'view' | 'report'

async function detectWilaya(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'fr', 'User-Agent': 'gov_djihane/1.0' } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const state: string | undefined = data.address?.state
    if (!state) return null
    const cleaned = state.replace(/^wilaya\s+d[e']\s+/i, '').trim()
    return ALGERIAN_WILAYAS.find((w) => w.toLowerCase() === cleaned.toLowerCase()) ?? null
  } catch {
    return null
  }
}

export default function CitizenMap() {
  const [mode, setMode] = useState<MapMode>('view')
  const [showSignalements, setShowSignalements] = useState(true)
  const [showProjects, setShowProjects] = useState(false)
  const [markers, setMarkers] = useState<SignalementMarker[]>([])
  const [projectMarkers, setProjectMarkers] = useState<ProjectMarkerData[]>([])
  const [pendingPoint, setPendingPoint] = useState<GeoPoint | null>(null)
  const [detectedWilaya, setDetectedWilaya] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [loadingMarkers, setLoadingMarkers] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  const fetchSignalements = useCallback(async () => {
    setLoadingMarkers(true)
    try {
      const res = await fetch('/api/signalements?limit=300')
      if (res.ok) setMarkers((await res.json()).markers ?? [])
    } catch { /* silent */ } finally { setLoadingMarkers(false) }
  }, [])

  const fetchProjects = useCallback(async () => {
    if (projectMarkers.length > 0) return
    setLoadingProjects(true)
    try {
      const res = await fetch('/api/projets?limit=200')
      if (res.ok) setProjectMarkers((await res.json()).markers ?? [])
    } catch { /* silent */ } finally { setLoadingProjects(false) }
  }, [projectMarkers.length])

  useEffect(() => { fetchSignalements() }, [fetchSignalements])

  useEffect(() => {
    if (showProjects) fetchProjects()
  }, [showProjects, fetchProjects])

  // Auto-detect wilaya from GPS when a point is placed
  useEffect(() => {
    if (!pendingPoint) { setDetectedWilaya(null); return }
    detectWilaya(pendingPoint.lat, pendingPoint.lng).then(setDetectedWilaya)
  }, [pendingPoint])

  const handleMapClick = useCallback(
    (point: GeoPoint) => {
      if (mode === 'report') {
        setPendingPoint(point)
        setSelectedProjectId(null)
      }
    },
    [mode],
  )

  const handleProjectClick = useCallback((id: string) => {
    setSelectedProjectId(id)
    setMode('view')
    setPendingPoint(null)
  }, [])

  function handleSignalementSuccess(id: string) {
    setToastMsg(`Signalement #${id.slice(0, 8)} enregistré`)
    setTimeout(() => setToastMsg(null), 4000)
    setMode('view')
    setPendingPoint(null)
    fetchSignalements()
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <LeafletMap
        markers={markers}
        showSignalements={showSignalements}
        projectMarkers={projectMarkers}
        showProjects={showProjects}
        onMapClick={handleMapClick}
        onProjectClick={handleProjectClick}
        pendingPoint={pendingPoint}
        clickable={mode === 'report'}
      />

      {/* Top toolbar — layer toggles */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 shadow-xl space-y-2.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Couches</p>

          {/* Signalements toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={showSignalements}
              onClick={() => setShowSignalements((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${showSignalements ? 'bg-emerald-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showSignalements ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm text-gray-200">Signalements</span>
            {loadingMarkers && <span className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />}
          </label>

          {/* Projects toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={showProjects}
              onClick={() => setShowProjects((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${showProjects ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showProjects ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm text-gray-200">Projets PAW</span>
            {loadingProjects && <span className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />}
          </label>

          {/* Legend */}
          {(showSignalements || showProjects) && (
            <div className="pt-1 border-t border-gray-700 space-y-1">
              {showSignalements && (
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 10 15" width="10" height="15">
                    <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 10 5 10S10 8.75 10 5C10 2.24 7.76 0 5 0z" fill="#10b981" />
                  </svg>
                  <span className="text-xs text-gray-400">Signalement</span>
                </div>
              )}
              {showProjects && (
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <polygon points="6,1 11,6 6,11 1,6" fill="#3b82f6" />
                  </svg>
                  <span className="text-xs text-gray-400">Projet PAW</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report mode banner */}
      {mode === 'report' && !pendingPoint && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-emerald-900/90 backdrop-blur-sm border border-emerald-700 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <p className="text-sm text-emerald-200 font-medium">Cliquez sur la carte pour localiser le problème</p>
            <button
              onClick={() => { setMode('view'); setPendingPoint(null) }}
              className="ml-2 text-emerald-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Signaler button */}
      {mode === 'view' && !selectedProjectId && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            onClick={() => { setMode('report'); setPendingPoint(null); setSelectedProjectId(null) }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full px-6 py-3 shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Signaler un problème
          </button>
        </div>
      )}

      {/* Project drawer */}
      <ProjectDrawer
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />

      {/* Signalement side panel */}
      {pendingPoint && mode === 'report' && (
        <SignalementPanel
          point={pendingPoint}
          defaultWilaya={detectedWilaya}
          onClose={() => { setMode('view'); setPendingPoint(null) }}
          onSuccess={handleSignalementSuccess}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="absolute bottom-8 left-4 z-[1001]">
          <div className="bg-gray-900/95 border border-emerald-700 rounded-xl px-4 py-3 shadow-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-emerald-300">{toastMsg}</p>
          </div>
        </div>
      )}

      {/* Counts */}
      <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-1.5">
        {showSignalements && markers.length > 0 && (
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1.5">
            <p className="text-xs text-gray-400">
              <span className="text-white font-semibold">{markers.length}</span> signalement{markers.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
        {showProjects && projectMarkers.length > 0 && (
          <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1.5">
            <p className="text-xs text-gray-400">
              <span className="text-white font-semibold">{projectMarkers.length}</span> projet{projectMarkers.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
