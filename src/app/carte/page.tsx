import { getSession } from '@/lib/session'
import { logout } from '@/app/actions/auth'
import CitizenMap from '@/components/maps/CitizenMap'
import NotificationBell from '@/components/citizen/NotificationBell'
import Link from 'next/link'

export default async function CartePage() {
  const session = await getSession()

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="relative shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-[1001]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">Gouvernance Participative</p>
            <p className="text-gray-500 text-xs">République Algérienne</p>
          </div>
          <span className="sm:hidden text-white font-bold text-sm">GovDZ</span>
        </Link>


        {/* Right actions */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {session.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-200 max-w-[120px] truncate">{session.name}</span>
              </div>
              <form action={logout}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
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
            </div>
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
