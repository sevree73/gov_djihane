import Link from 'next/link'
import { getSession } from '@/lib/session'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Gouvernance Participative</p>
            <p className="text-gray-500 text-xs">République Algérienne Démocratique et Populaire</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/consultations"
            className="hidden sm:block px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Consultations
          </Link>
          {session ? (
            <Link
              href="/carte"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Accéder à la carte
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-900/40 border border-emerald-700/40 rounded-full text-emerald-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Plateforme officielle de participation citoyenne
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl leading-tight">
          Participez à la{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            gouvernance
          </span>{' '}
          de votre wilaya
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed">
          Signalez des problèmes, suivez les projets territoriaux et participez aux
          consultations publiques. Votre voix compte.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/carte"
            className="flex items-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-base font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-900/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Accéder à la carte
          </Link>
          {!session && (
            <Link
              href="/inscription"
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-base font-semibold rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Créer un compte citoyen
            </Link>
          )}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Signalez un problème</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Routes dégradées, éclairage défaillant, déchets sauvages — signalez directement sur la carte.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Suivez les projets</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Consultez l&apos;avancement des projets d&apos;infrastructure et d&apos;aménagement dans votre wilaya.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Consultations publiques</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Donnez votre avis sur les décisions locales et participez aux consultations ouvertes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 px-6 py-4 flex items-center justify-between text-xs text-gray-600">
        <span>© {new Date().getFullYear()} République Algérienne Démocratique et Populaire</span>
        <Link href="/admin/connexion" className="hover:text-gray-400 transition-colors">
          Espace administration
        </Link>
      </footer>
    </div>
  )
}
