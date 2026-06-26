import Link from 'next/link'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import AdminLoginForm from '@/components/AdminLoginForm'

const FEATURE_BULLETS = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    ),
    label: 'Carte interactive',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    label: 'Signalements citoyens',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
    label: 'Actions du PAT',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    label: 'Tableaux de bord',
  },
]

export default async function LandingPage() {
  const [
    session,
    patCount,
    communesResult,
    signalementTotal,
    signalementTraites,
    actionsEnCours,
  ] = await Promise.all([
    getSession(),
    prisma.pAT.count(),
    prisma.signalement.findMany({
      distinct: ['commune'],
      where: { commune: { not: null } },
      select: { commune: true },
    }),
    prisma.signalement.count(),
    prisma.signalement.count({ where: { status: { in: ['RESOLU', 'PRIS_EN_CHARGE'] } } }),
    prisma.pATAction.count({ where: { status: 'EN_COURS' } }),
  ])

  const communesCount = communesResult.length
  const traitesPercent = signalementTotal > 0
    ? Math.round((signalementTraites / signalementTotal) * 100)
    : 0

  const stats = [
    { value: String(patCount), label: "Programmes d'action (PAT)" },
    { value: String(communesCount || '—'), label: 'Communes couvertes' },
    { value: signalementTotal > 0 ? `${traitesPercent}%` : '—', label: 'Signalements traités' },
    { value: String(actionsEnCours), label: 'Actions en cours' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200/70 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 leading-tight">Gouvernance Participative</p>
            <p className="text-gray-400 text-xs">République Algérienne Démocratique et Populaire</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/carte"
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Carte publique
          </Link>
          {session ? (
            <Link
              href="/admin/dashboard"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Tableau de bord
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Espace citoyen
            </Link>
          )}
        </nav>
      </header>

      {/* Hero — two column */}
      <main className="flex-1 flex items-center px-6 py-12 md:py-20">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left column */}
          <div className="space-y-8">
            {/* Green label */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Plan d&apos;Aménagement de Wilaya
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Suivre les projets du PAW de{' '}
              <span className="text-emerald-600">Timimoun</span>
              {', '}ensemble.
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-lg leading-relaxed max-w-lg">
              Consultez l&apos;avancement des projets d&apos;infrastructure, signalez des problèmes
              et participez au développement territorial de votre wilaya.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/carte"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Accès citoyen
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/admin/connexion"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors"
              >
                Espace administration
              </Link>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-3 pt-2">
              {FEATURE_BULLETS.map((b) => (
                <li key={b.label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {b.icon}
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{b.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — login card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Connexion</h2>
              <p className="text-sm text-gray-500 mt-1">Espace administration et services</p>
            </div>
            <AdminLoginForm />
          </div>
        </div>
      </main>

      {/* Stats bar */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
