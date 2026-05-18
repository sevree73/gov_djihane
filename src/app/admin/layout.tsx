import type { ReactNode } from 'react'
import { verifySession } from '@/lib/dal'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types'
import { logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await verifySession()

  if (!session) return <>{children}</>

  const recuCount = await prisma.signalement.count({ where: { status: 'RECU' } })

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-gray-900 text-white flex flex-col h-screen overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-700">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Administration
          </p>
          <p className="mt-1 text-white font-bold text-lg leading-tight">
            Gouvernance Territoriale
          </p>
        </div>

        {session && (
          <div className="px-6 py-4 border-b border-gray-700">
            <p className="text-sm font-medium text-white truncate">{session.name}</p>
            <p className="text-xs text-emerald-400 mt-0.5">
              {ROLE_LABELS[session.role as Role]}
            </p>
            {session.wilaya && (
              <p className="text-xs text-gray-400 mt-0.5">Wilaya de {session.wilaya}</p>
            )}
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin/dashboard', label: 'Tableau de bord', icon: '⬛' },
            { href: '/admin/signalements', label: 'Signalements', icon: '📋', badge: recuCount > 0 ? recuCount : undefined },
            { href: '/admin/projets', label: 'Projets', icon: '🏗' },
            { href: '/admin/consultations', label: 'Consultations', icon: '🗳' },
            { href: '/admin/analytics', label: 'Analytiques', icon: '📊' },
            { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: '👥' },
          ].map(({ href, label, icon, badge }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <span>{icon}</span>
              <span className="flex-1">{label}</span>
              {badge !== undefined && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <span>🚪</span>
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto h-screen">{children}</main>
    </div>
  )
}
