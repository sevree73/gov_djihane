'use client'

import { useActionState, useState } from 'react'
import { updateSignalementStatus, type UpdateStatusState } from '@/app/actions/signalements'
import StatusBadge from './StatusBadge'
import SignalementDetailModal, { type SignalementDetail } from './SignalementDetailModal'
import { SIGNALEMENT_CATEGORIES, SIGNALEMENT_STATUSES } from '@/lib/constants'

type Signalement = SignalementDetail

const NEXT_STATUSES: Record<string, string[]> = {
  RECU:           ['EN_COURS', 'REJETE'],
  EN_COURS:       ['PRIS_EN_CHARGE', 'RESOLU', 'REJETE'],
  PRIS_EN_CHARGE: ['RESOLU', 'REJETE'],
  RESOLU:         [],
  REJETE:         [],
}

function StatusUpdateRow({
  s,
  onViewDetails,
}: {
  s: Signalement
  onViewDetails: (s: Signalement) => void
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<UpdateStatusState, FormData>(
    updateSignalementStatus,
    undefined,
  )

  const nextStatuses = NEXT_STATUSES[s.status] ?? []

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Title — clickable to open detail modal */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => onViewDetails(s)}
            className="text-left group"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 max-w-[200px] truncate transition-colors">
              {s.title}
            </p>
            {s.mediaUrls?.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {s.mediaUrls.length} photo{s.mediaUrls.length > 1 ? 's' : ''}
              </p>
            )}
          </button>
        </td>

        <td className="px-4 py-3 text-xs text-gray-500">
          {SIGNALEMENT_CATEGORIES[s.category as keyof typeof SIGNALEMENT_CATEGORIES] ?? s.category}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={s.status} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {s.wilaya ?? '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {s.citizen.name}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {new Date(s.createdAt).toLocaleDateString('fr-DZ', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </td>
        <td className="px-4 py-3 text-right">
          {nextStatuses.length > 0 && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {open ? 'Annuler' : 'Mettre à jour'}
            </button>
          )}
        </td>
      </tr>

      {open && nextStatuses.length > 0 && (
        <tr className="bg-blue-50 border-t border-blue-100">
          <td colSpan={7} className="px-4 py-3">
            <form action={action} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="signalementId" value={s.id} />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nouveau statut
                </label>
                <select
                  name="newStatus"
                  required
                  defaultValue={nextStatuses[0]}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {nextStatuses.map((st) => (
                    <option key={st} value={st}>
                      {SIGNALEMENT_STATUSES[st as keyof typeof SIGNALEMENT_STATUSES] ?? st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Commentaire (optionnel)
                </label>
                <input
                  name="comment"
                  type="text"
                  maxLength={500}
                  placeholder="Note de traitement…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {pending ? 'Enregistrement…' : 'Confirmer'}
              </button>

              {state?.error && (
                <p className="text-xs text-red-600">{state.error}</p>
              )}
              {state?.success && (
                <p className="text-xs text-emerald-600">Statut mis à jour</p>
              )}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}

export default function SignalementTable({ signalements }: { signalements: Signalement[] }) {
  const [detailRow, setDetailRow] = useState<Signalement | null>(null)

  if (signalements.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="font-medium text-gray-600">Aucun signalement</p>
        <p className="text-sm mt-1">Les signalements des citoyens apparaîtront ici.</p>
      </div>
    )
  }

  return (
    <>
      {detailRow && (
        <SignalementDetailModal
          signalement={detailRow}
          onClose={() => setDetailRow(null)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Titre', 'Catégorie', 'Statut', 'Wilaya', 'Citoyen', 'Date', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {signalements.map((s) => (
              <StatusUpdateRow key={s.id} s={s} onViewDetails={setDetailRow} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
