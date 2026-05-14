'use client'

import { useEffect } from 'react'
import StatusBadge from './StatusBadge'
import { SIGNALEMENT_CATEGORIES, SIGNALEMENT_STATUSES } from '@/lib/constants'

export type SignalementDetail = {
  id: string
  title: string
  description: string
  category: string
  status: string
  wilaya: string | null
  commune: string | null
  createdAt: Date | string
  mediaUrls: string[]
  citizen: { name: string; email: string }
}

interface Props {
  signalement: SignalementDetail
  onClose: () => void
}

export default function SignalementDetailModal({ signalement: s, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const categoryLabel =
    SIGNALEMENT_CATEGORIES[s.category as keyof typeof SIGNALEMENT_CATEGORIES] ?? s.category
  const statusLabel =
    SIGNALEMENT_STATUSES[s.status as keyof typeof SIGNALEMENT_STATUSES] ?? s.status

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Card — stop propagation so clicks inside don't close */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {categoryLabel}
            </p>
            <h2 className="text-lg font-bold text-gray-900 leading-snug">{s.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={s.status} />
            {s.wilaya && (
              <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-600 font-medium">
                {s.wilaya}{s.commune ? ` — ${s.commune}` : ''}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {new Date(s.createdAt).toLocaleDateString('fr-DZ', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Citizen */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
              {s.citizen.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{s.citizen.name}</p>
              <p className="text-xs text-gray-500">{s.citizen.email}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Description
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {s.description}
            </p>
          </div>

          {/* Photos */}
          {s.mediaUrls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Photos ({s.mediaUrls.length})
              </p>
              <div className="grid grid-cols-3 gap-3">
                {s.mediaUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {s.mediaUrls?.length === 0 && (
            <div className="py-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
              Aucune photo jointe
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
