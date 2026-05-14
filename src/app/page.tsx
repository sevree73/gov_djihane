import { getSession } from '@/lib/session'
import { logout } from '@/app/actions/auth'
import CitizenMap from '@/components/maps/CitizenMap'
import NotificationBell from '@/components/citizen/NotificationBell'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getSession()

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="relative shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 z-[1001]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">Gouvernance Participative</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/consultations"
            className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
          >
            Consultations
          </a>
          {session ? (
            <>
              <NotificationBell />
              <span className="text-sm text-gray-400 hidden sm:block">{session.name}</span>
              <form action={logout}>
                <button className="text-xs text-gray-400 hover:text-white transition-colors">Déconnexion</button>
              </form>
            </>
          ) : (
            <Link
              href="/connexion"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </nav>

      {/* Full-screen map */}
      <div className="flex-1 relative">
        <CitizenMap />
      </div>
    </div>
  )
}
