import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from './session'
import { ADMIN_ROLES } from './constants'
import type { Role } from '@/types'

/** Reads and verifies the session cookie. Returns null if missing or expired. */
export const verifySession = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null
  return session
})

/** Asserts a citizen session exists; redirects to /connexion otherwise. */
export const requireCitizen = cache(async () => {
  const session = await verifySession()
  if (!session || session.role !== 'CITOYEN') redirect('/connexion')
  return session
})

/** Asserts any institutional role; redirects to /admin/connexion otherwise. */
export const requireAdmin = cache(async () => {
  const session = await verifySession()
  if (!session || !ADMIN_ROLES.includes(session.role as Role)) {
    redirect('/admin/connexion')
  }
  return session
})

/** Asserts a minimum role level using the hierarchy. */
export const requireRole = (minimumRole: Role) =>
  cache(async () => {
    const session = await verifySession()
    if (!session) redirect('/admin/connexion')
    const { ROLE_HIERARCHY } = await import('./auth')
    if (ROLE_HIERARCHY[session.role as Role] < ROLE_HIERARCHY[minimumRole]) {
      redirect('/admin/connexion')
    }
    return session
  })
