import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession } from '@/lib/session'

// Inline the cookie name to avoid importing server-only modules
const COOKIE_NAME = 'gov_session'

const ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'ADMIN_MINISTERE',
  'ADMIN_WILAYA',
  'GESTIONNAIRE_TERRITORIAL',
  'AGENT_TECHNIQUE',
])

// Admin routes that don't require a session (login page)
const ADMIN_PUBLIC = new Set(['/admin/connexion'])

// Citizen routes that require a CITOYEN session
const CITIZEN_PROTECTED_PREFIXES = ['/signalements/nouveau', '/profil']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value
  const session = await decryptSession(token)
  const role = session?.role ?? null

  // ── Admin section ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!ADMIN_PUBLIC.has(pathname)) {
      // Not authenticated → send to admin login
      if (!role || !ADMIN_ROLES.has(role)) {
        return NextResponse.redirect(new URL('/admin/connexion', request.url))
      }
    }

    // Already logged-in admin visiting the login page → dashboard
    if (ADMIN_PUBLIC.has(pathname) && role && ADMIN_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  // ── Citizen protected routes ───────────────────────────────────────────────
  if (CITIZEN_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (role !== 'CITOYEN') {
      const loginUrl = new URL('/connexion', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Already logged-in citizen visiting /connexion ──────────────────────────
  if (pathname === '/connexion' && role === 'CITOYEN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
