import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import {
  updatePAT,
  deletePAT,
  addPATAction,
  updatePATActionStatus,
  deletePATAction,
} from '@/app/actions/pats'

// ── Computed indicateurs ──────────────────────────────────────────────────────

type Action = { id: string; text: string; deadline: Date; status: string; createdAt: Date }

function computeIndicateurs(actions: Action[]) {
  const programmees = actions.length
  const achevees = actions.filter((a) => a.status === 'DONE').length
  const enCours = actions.filter((a) => a.status === 'EN_COURS').length
  const enRetard = actions.filter((a) => a.status === 'RETARD').length
  const donneesValue = programmees > 0 ? Math.round((achevees / programmees) * 100) : 0
  const IAP = programmees > 0 ? (achevees + 0.5 * enCours) / programmees : 0
  // Score PAT /5 — formula: IAP × 5 (will update when formula provided)
  const scorePAT = Math.round(IAP * 5 * 10) / 10
  const alerts = enRetard

  let niveauDeRisque: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ'
  if (IAP >= 0.7) niveauDeRisque = 'FAIBLE'
  else if (IAP >= 0.4) niveauDeRisque = 'MOYEN'
  else niveauDeRisque = 'ÉLEVÉ'

  return { programmees, achevees, enCours, enRetard, donneesValue, IAP, scorePAT, niveauDeRisque, alerts }
}

const RISK_COLORS = {
  FAIBLE: 'bg-emerald-100 text-emerald-700',
  MOYEN: 'bg-amber-100 text-amber-700',
  ÉLEVÉ: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  RETARD: 'Retard',
  DONE: 'Achevée',
}

const STATUS_CLASSES: Record<string, string> = {
  EN_COURS: 'bg-blue-100 text-blue-700',
  RETARD: 'bg-red-100 text-red-600',
  DONE: 'bg-emerald-100 text-emerald-700',
}

export default async function PATDetailPage({
  params,
}: {
  params: Promise<{ id: string; patId: string }>
}) {
  await requireAdmin()
  const { id: projectId, patId } = await params

  const pat = await prisma.pAT.findUnique({
    where: { id: patId },
    include: {
      project: { select: { id: true, title: true, wilaya: true } },
      actions: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!pat || pat.projectId !== projectId) notFound()

  const ind = computeIndicateurs(pat.actions)
  const suivis = pat.actions.filter((a) => a.status === 'DONE')
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/projets" className="hover:text-gray-700 transition-colors">Projets</Link>
        <span>›</span>
        <Link href={`/admin/projets/${projectId}/pats`} className="hover:text-gray-700 transition-colors truncate max-w-[160px]">
          {pat.project.title}
        </Link>
        <span>›</span>
        <Link href={`/admin/projets/${projectId}/pats`} className="hover:text-gray-700 transition-colors">PATs</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium truncate max-w-[160px]">{pat.name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <form action={updatePAT} className="space-y-3">
              <input type="hidden" name="patId" value={patId} />
              <div className="flex items-center gap-2">
                <input
                  name="name"
                  type="text"
                  defaultValue={pat.name}
                  required
                  minLength={3}
                  maxLength={200}
                  className="text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent flex-1 transition-colors"
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Avancement (%)</label>
                  <input
                    name="avancement"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={pat.avancement}
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors">
                  Enregistrer
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>PAW : {pat.project.title}</span>
                {pat.project.wilaya && <span className="px-2 py-0.5 bg-gray-100 rounded-full">{pat.project.wilaya}</span>}
              </div>
            </form>
          </div>
          <form action={deletePAT}>
            <input type="hidden" name="patId" value={patId} />
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              Supprimer le PAT
            </button>
          </form>
        </div>
      </div>

      {/* Alerts banner */}
      {ind.alerts > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-700">
            {ind.alerts} action{ind.alerts > 1 ? 's' : ''} en retard — intervention requise.
          </p>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{ind.enCours}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">Actions en cours</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-700">{ind.achevees}</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">PAT Suivis</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${ind.alerts > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
          <p className={`text-3xl font-bold ${ind.alerts > 0 ? 'text-red-600' : 'text-gray-400'}`}>{ind.alerts}</p>
          <p className={`text-xs mt-1 font-medium ${ind.alerts > 0 ? 'text-red-500' : 'text-gray-400'}`}>Alertes</p>
        </div>
      </div>

      {/* Indicateurs */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Indicateurs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{ind.programmees}</p>
            <p className="text-xs text-gray-500 mt-0.5">Actions programmées</p>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{ind.achevees}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Actions achevées</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{ind.enCours}</p>
            <p className="text-xs text-blue-600 mt-0.5">Actions en cours</p>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{ind.donneesValue}%</p>
            <p className="text-xs text-gray-500 mt-0.5">Données (%)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Indice IAP</p>
            <p className="text-2xl font-bold text-gray-900">{ind.IAP.toFixed(3)}</p>
            <p className="text-xs text-gray-400 mt-1">
              (achevées + 0.5 × en cours) / programmées
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Score PAT</p>
            <p className="text-2xl font-bold text-gray-900">{ind.scorePAT}<span className="text-base text-gray-400">/5</span></p>
            <p className="text-xs text-gray-400 mt-1">IAP × 5</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
            <p className="text-xs text-gray-400 mb-2">Niveau de risque</p>
            <span className={`self-start text-sm font-semibold px-3 py-1 rounded-full ${RISK_COLORS[ind.niveauDeRisque]}`}>
              {ind.niveauDeRisque}
            </span>
          </div>
        </div>
      </div>

      {/* PAT Suivis */}
      {suivis.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">PAT Suivis</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {suivis.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="flex-1 text-sm text-gray-700">{a.text}</p>
                <span className="text-xs text-gray-400">
                  {new Date(a.deadline).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Actions
          <span className="ml-2 text-xs font-normal text-gray-400">{pat.actions.length} action{pat.actions.length !== 1 ? 's' : ''}</span>
        </h2>

        {pat.actions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-10">
            <p className="text-sm text-gray-400">Aucune action pour ce PAT. Ajoutez-en une ci-dessous.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Action', 'Échéance', 'Statut', 'Modifier statut', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pat.actions.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">{a.text}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(a.deadline).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASSES[a.status] ?? ''}`}>
                        {STATUS_LABELS[a.status] ?? a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updatePATActionStatus} className="flex items-center gap-2">
                        <input type="hidden" name="actionId" value={a.id} />
                        <input type="hidden" name="patId" value={patId} />
                        <select
                          name="status"
                          defaultValue={a.status}
                          className="text-xs rounded-lg border border-gray-200 px-2 py-1 focus:outline-none focus:border-blue-400"
                        >
                          <option value="EN_COURS">En cours</option>
                          <option value="RETARD">Retard</option>
                          <option value="DONE">Achevée</option>
                        </select>
                        <button type="submit" className="text-xs text-blue-600 hover:underline font-medium">
                          OK
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={deletePATAction}>
                        <input type="hidden" name="actionId" value={a.id} />
                        <input type="hidden" name="patId" value={patId} />
                        <button type="submit" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add action form */}
        <form action={addPATAction} className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
          <input type="hidden" name="patId" value={patId} />
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Intitulé de l&apos;action</label>
            <input
              name="text"
              type="text"
              required
              maxLength={500}
              placeholder="Décrire l'action…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-600 mb-1">Échéance</label>
            <input
              name="deadline"
              type="date"
              required
              min={today}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </form>
      </div>
    </div>
  )
}
