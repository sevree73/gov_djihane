import type { Role } from '@/types'

/**
 * Numeric weight for each role. Higher = more privileges.
 * Used by requireRole() in dal.ts to enforce minimum access levels.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN_MINISTERE: 80,
  ADMIN_WILAYA: 60,
  GESTIONNAIRE_TERRITORIAL: 40,
  AGENT_TECHNIQUE: 20,
  CITOYEN: 0,
}

export function hasMinimumRole(userRole: Role, minimum: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimum]
}

// ── Granular permission checks ──────────────────────────────────────────────

export function canManageUsers(role: Role): boolean {
  return hasMinimumRole(role, 'ADMIN_WILAYA')
}

export function canManageAllWilayas(role: Role): boolean {
  return hasMinimumRole(role, 'ADMIN_MINISTERE')
}

export function canManageProjects(role: Role): boolean {
  return hasMinimumRole(role, 'GESTIONNAIRE_TERRITORIAL')
}

export function canUpdateSignalement(role: Role): boolean {
  return hasMinimumRole(role, 'AGENT_TECHNIQUE')
}

export function canViewAnalytics(role: Role): boolean {
  return hasMinimumRole(role, 'GESTIONNAIRE_TERRITORIAL')
}

export function canPublishConsultation(role: Role): boolean {
  return hasMinimumRole(role, 'ADMIN_WILAYA')
}

export function canConfigurePlatform(role: Role): boolean {
  return role === 'SUPER_ADMIN'
}
