'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, updateUser, type UserFormState } from '@/app/actions/users'
import { ALGERIAN_WILAYAS, ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types'

const ALL_ROLES: Role[] = [
  'SUPER_ADMIN', 'ADMIN_MINISTERE', 'ADMIN_WILAYA',
  'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE', 'CITOYEN',
]

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export type UserModalData = {
  id: string
  name: string
  email: string
  role: Role
  wilaya: string | null
  isActive: boolean
}

interface UserFormModalProps {
  mode: 'create' | 'edit'
  user?: UserModalData | null
  onClose: () => void
}

const INPUT_CLASS =
  'w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ' +
  'placeholder:text-gray-400 transition-colors bg-white'

const SELECT_CLASS =
  'w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 ' +
  'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ' +
  'transition-colors bg-white'

const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-1.5'

export default function UserFormModal({ mode, user, onClose }: UserFormModalProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  // Bind the update action for edit mode — keying the component handles remount per user
  const serverAction = isEdit ? updateUser.bind(null, user!.id) : createUser
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    serverAction,
    undefined,
  )

  const [selectedRole, setSelectedRole] = useState<Role>(user?.role ?? 'CITOYEN')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const showWilaya = WILAYA_ROLES.includes(selectedRole)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state?.success]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
            {isEdit && user && (
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="user-form" action={formAction} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {state?.error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700 font-medium">{state.error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className={LABEL_CLASS}>
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={user?.name ?? ''}
              placeholder="Prénom et nom"
              className={INPUT_CLASS}
            />
            {state?.errors?.name && (
              <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className={LABEL_CLASS}>
              Adresse email <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={user?.email ?? ''}
              placeholder="prenom.nom@gov.dz"
              className={INPUT_CLASS}
            />
            {state?.errors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className={LABEL_CLASS}>
              Mot de passe{' '}
              {isEdit ? (
                <span className="text-gray-400 font-normal text-xs">(laisser vide pour ne pas changer)</span>
              ) : (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              name="password"
              type="password"
              required={!isEdit}
              minLength={8}
              placeholder={isEdit ? '••••••••' : 'Minimum 8 caractères'}
              className={INPUT_CLASS}
            />
            {state?.errors?.password && (
              <p className="mt-1 text-xs text-red-600">{state.errors.password[0]}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className={LABEL_CLASS}>
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              defaultValue={user?.role ?? 'CITOYEN'}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className={SELECT_CLASS}
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Wilaya — conditional */}
          {showWilaya && (
            <div>
              <label className={LABEL_CLASS}>
                Wilaya de rattachement <span className="text-red-500">*</span>
              </label>
              <select
                name="wilaya"
                defaultValue={user?.wilaya ?? ''}
                className={SELECT_CLASS}
              >
                <option value="">— Sélectionner —</option>
                {ALGERIAN_WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          )}

          {/* isActive — edit only */}
          {isEdit && (
            <div>
              <input type="hidden" name="isActive" value={isActive ? 'true' : 'false'} />
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isActive ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isActive ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  {isActive ? 'Compte actif' : 'Compte désactivé'}
                </span>
              </label>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            form="user-form"
            type="submit"
            disabled={pending}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
          >
            {pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'}
          </button>
        </div>
      </div>
    </div>
  )
}
