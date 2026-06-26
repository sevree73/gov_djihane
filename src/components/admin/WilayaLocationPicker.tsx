'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { WILAYA_CENTERS } from '@/lib/constants'
import type { GeoPoint } from '@/types'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface WilayaLocationPickerProps {
  wilaya: string | null | undefined
  onSelect: (point: GeoPoint) => void
  initial?: GeoPoint | null
}

export default function WilayaLocationPicker({ wilaya, onSelect, initial }: WilayaLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center = (wilaya ? WILAYA_CENTERS[wilaya] : null) ?? { lat: 28.0339, lng: 1.6596, zoom: 5 }

    const map = L.map(containerRef.current, {
      center: initial ? [initial.lat, initial.lng] : [center.lat, center.lng],
      zoom: initial ? 13 : center.zoom,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    if (initial) {
      markerRef.current = L.marker([initial.lat, initial.lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const ll = markerRef.current!.getLatLng()
        onSelect({ lat: ll.lat, lng: ll.lng })
      })
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const ll = markerRef.current!.getLatLng()
          onSelect({ lat: ll.lat, lng: ll.lng })
        })
      }
      onSelect({ lat, lng })
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-600 px-3 py-1 rounded-full shadow pointer-events-none z-[1000]">
        Cliquez pour positionner le PAT{wilaya ? ` dans la wilaya de ${wilaya}` : ''}
      </div>
    </div>
  )
}
