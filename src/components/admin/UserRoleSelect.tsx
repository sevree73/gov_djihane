'use client'

import { useTransition, useState } from 'react'
import { updateUserRole } from '@/app/actions/users'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types'

const ALL_ROLES: Role[] = [
  'SUPER_ADMIN', 'ADMIN_MINISTERE', 'ADMIN_WILAYA',
  'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE', 'CITOYEN',
]

interface Props { userId: string; currentRole: Role; isSelf: boolean }

export default function UserRoleSelect({ userId, currentRole, isSelf }: Props) {
  const [role, setRole] = useState<Role>(currentRole)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isSelf) {
    return (
      <span className="text-xs font-medium text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
        {ROLE_LABELS[role]}
      </span>
    )
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role
    const prev = role
    setRole(newRole)
    setError(null)
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole)
      if (res.error) { setRole(prev); setError(res.error) }
    })
  }

  return (
    <div className="space-y-1">
      <select
        value={role}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50 bg-white"
      >
        {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      {isPending && <p className="text-xs text-gray-400">Sauvegarde…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
