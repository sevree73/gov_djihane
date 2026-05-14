'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  EN_ATTENTE: { bg: 'bg-gray-100',    text: 'text-gray-600',    bar: '#9ca3af' },
  EN_COURS:   { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: '#3b82f6' },
  SUSPENDU:   { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: '#f59e0b' },
  TERMINE:    { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10b981' },
  ANNULE:     { bg: 'bg-red-100',     text: 'text-red-600',     bar: '#ef4444' },
}

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS:   'En cours',
  SUSPENDU:   'Suspendu',
  TERMINE:    'Terminé',
  ANNULE:     'Annulé',
}

type ProjectDetail = {
  id: string
  title: string
  description: string
  sector: string
  status: string
  advancementRate: number
  wilaya: string | null
  budget: string | null
  startDate: string | null
  endDate: string | null
  createdBy: string
  consultations: { id: string; title: string; _count: { votes: number } }[]
  commentCount: number
}

function formatBudget(budget: string | null): string {
  if (!budget) return '—'
  const n = parseFloat(budget)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Mds DZD`
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} M DZD`
  return `${n.toLocaleString('fr-DZ')} DZD`
}

interface ProjectDrawerProps {
  projectId: string | null
  onClose: () => void
}

export default function ProjectDrawer({ projectId, onClose }: ProjectDrawerProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) { setProject(null); return }
    setLoading(true)
    setError(null)
    fetch(`/api/projets/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setProject(data)
      })
      .catch(() => setError('Erreur lors du chargement'))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!projectId) return null

  const colors = project
    ? (STATUS_COLORS[project.status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#6b7280' })
    : null

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-[1000] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-white font-semibold text-base">Projet PAW</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="m-5 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {project && colors && (
          <div className="px-5 py-4 space-y-5">
            {/* Title + status */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {project.sector}
              </p>
              <h3 className="text-white font-bold text-base leading-snug">{project.title}</h3>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                {project.wilaya && (
                  <span className="text-xs text-gray-400">{project.wilaya}</span>
                )}
              </div>
            </div>

            {/* Advancement bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-400 font-medium">Avancement</span>
                <span className="text-sm font-bold text-white">{project.advancementRate}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${project.advancementRate}%`, background: colors.bar }}
                />
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {project.budget && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Budget</p>
                  <p className="text-gray-200 font-medium">{formatBudget(project.budget)}</p>
                </div>
              )}
              {project.startDate && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Début</p>
                  <p className="text-gray-200 font-medium">
                    {new Date(project.startDate).toLocaleDateString('fr-DZ', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
              {project.endDate && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Échéance</p>
                  <p className="text-gray-200 font-medium">
                    {new Date(project.endDate).toLocaleDateString('fr-DZ', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Responsable</p>
                <p className="text-gray-200 font-medium">{project.createdBy}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Description</p>
              <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{project.description}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {project.commentCount} commentaire{project.commentCount !== 1 ? 's' : ''}
              </div>
              {project.consultations.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {project.consultations.length} consultation{project.consultations.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Active consultations */}
            {project.consultations.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Consultations ouvertes
                </p>
                <div className="space-y-2">
                  {project.consultations.map((c) => (
                    <Link
                      key={c.id}
                      href={`/consultations/${c.id}`}
                      className="flex items-center justify-between bg-emerald-900/30 border border-emerald-700/50 rounded-lg px-3 py-2 hover:bg-emerald-900/50 transition-colors"
                    >
                      <p className="text-xs text-emerald-300 font-medium truncate pr-2">{c.title}</p>
                      <span className="text-xs text-emerald-400 shrink-0">Participer →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Full detail CTA */}
            <Link
              href={`/projets/${project.id}`}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
            >
              Voir le projet complet →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
