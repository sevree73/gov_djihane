'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { GeoPoint, SignalementMarker } from '@/types'
import { SIGNALEMENT_CATEGORIES, SIGNALEMENT_STATUSES } from '@/lib/constants'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export type ProjectMarkerData = {
  id: string
  title: string
  sector: string
  status: string
  advancementRate: number
  wilaya: string | null
  location: GeoPoint
}

const SIGNALEMENT_STATUS_COLORS: Record<string, string> = {
  RECU: '#f59e0b', EN_COURS: '#3b82f6', PRIS_EN_CHARGE: '#8b5cf6',
  RESOLU: '#10b981', REJETE: '#ef4444',
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  EN_ATTENTE: '#9ca3af', EN_COURS: '#3b82f6', SUSPENDU: '#f59e0b',
  TERMINE: '#10b981', ANNULE: '#ef4444',
}

function svgMarker(color: string, shape: 'circle' | 'diamond' = 'circle') {
  if (shape === 'diamond') {
    return L.divIcon({
      html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
        <polygon points="14,2 26,14 14,26 2,14" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="14" cy="14" r="4" fill="white"/>
      </svg>`,
      className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
    })
  }
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>`,
    className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36],
  })
}

function crosshairIcon() {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32S32 28 32 16C32 7.163 24.837 0 16 0z"
        fill="#10b981" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="#10b981"/>
    </svg>`,
    className: '', iconSize: [32, 48], iconAnchor: [16, 48], popupAnchor: [0, -48],
  })
}

interface LeafletMapProps {
  markers: SignalementMarker[]
  showSignalements: boolean
  projectMarkers?: ProjectMarkerData[]
  showProjects?: boolean
  onMapClick?: (point: GeoPoint) => void
  onProjectClick?: (id: string) => void
  pendingPoint?: GeoPoint | null
  clickable?: boolean
}

export default function LeafletMap({
  markers,
  showSignalements,
  projectMarkers = [],
  showProjects = false,
  onMapClick,
  onProjectClick,
  pendingPoint,
  clickable = false,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const sigLayerRef = useRef<L.LayerGroup | null>(null)
  const projLayerRef = useRef<L.LayerGroup | null>(null)
  const pendingMarkerRef = useRef<L.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [28.0339, 1.6596],
      zoom: 5,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    sigLayerRef.current = L.layerGroup().addTo(map)
    projLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    setMapReady(true)

    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !clickable || !onMapClick) return
    const handler = (e: L.LeafletMouseEvent) => onMapClick({ lng: e.latlng.lng, lat: e.latlng.lat })
    map.on('click', handler)
    map.getContainer().style.cursor = 'crosshair'
    return () => { map.off('click', handler); map.getContainer().style.cursor = '' }
  }, [clickable, onMapClick, mapReady])

  useEffect(() => {
    const layer = sigLayerRef.current
    if (!layer) return
    layer.clearLayers()
    if (!showSignalements) return

    markers.forEach((m) => {
      const mk = L.marker([m.location.lat, m.location.lng], {
        icon: svgMarker(SIGNALEMENT_STATUS_COLORS[m.status] ?? '#6b7280'),
      })
      mk.bindPopup(`
        <div style="min-width:180px">
          <p style="font-weight:600;margin:0 0 4px">${m.title}</p>
          <p style="margin:2px 0;font-size:12px;color:#6b7280">
            ${SIGNALEMENT_CATEGORIES[m.category as keyof typeof SIGNALEMENT_CATEGORIES] ?? m.category}
          </p>
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;
            background:${SIGNALEMENT_STATUS_COLORS[m.status] ?? '#6b7280'}20;
            color:${SIGNALEMENT_STATUS_COLORS[m.status] ?? '#6b7280'};
            border:1px solid ${SIGNALEMENT_STATUS_COLORS[m.status] ?? '#6b7280'}40">
            ${SIGNALEMENT_STATUSES[m.status as keyof typeof SIGNALEMENT_STATUSES] ?? m.status}
          </span>
        </div>`)
      layer.addLayer(mk)
    })
  }, [markers, showSignalements, mapReady])

  useEffect(() => {
    const layer = projLayerRef.current
    if (!layer) return
    layer.clearLayers()
    if (!showProjects) return

    projectMarkers.forEach((p) => {
      const color = PROJECT_STATUS_COLORS[p.status] ?? '#6b7280'
      const mk = L.marker([p.location.lat, p.location.lng], {
        icon: svgMarker(color, 'diamond'),
      })
      mk.bindTooltip(
        `<div style="min-width:140px">
           <p style="font-weight:600;margin:0 0 2px;font-size:13px">${p.title}</p>
           <p style="font-size:11px;color:#6b7280;margin:0">${p.sector}${p.wilaya ? ` · ${p.wilaya}` : ''}</p>
           <p style="font-size:11px;font-weight:600;margin:4px 0 0;color:${color}">${p.advancementRate}%</p>
         </div>`,
        { direction: 'top', offset: [0, -14] },
      )
      mk.on('click', () => onProjectClick?.(p.id))
      layer.addLayer(mk)
    })
  }, [projectMarkers, showProjects, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (pendingMarkerRef.current) { pendingMarkerRef.current.remove(); pendingMarkerRef.current = null }
    if (pendingPoint) {
      const m = L.marker([pendingPoint.lat, pendingPoint.lng], { icon: crosshairIcon() }).addTo(map)
      pendingMarkerRef.current = m
      map.setView([pendingPoint.lat, pendingPoint.lng], Math.max(map.getZoom(), 13))
    }
  }, [pendingPoint, mapReady])

  return <div ref={containerRef} className="h-full w-full" />
}
