'use client'

import { useActionState } from 'react'
import { loginAdmin, type LoginState } from '@/app/actions/auth'

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAdmin, undefined)

  return (
    <form action={action} className="space-y-4">
      {/* General error */}
      {state?.errors?.general && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3">
          <p className="text-sm text-red-300">{state.errors.general[0]}</p>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
          Identifiant institutionnel (email)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="agent@gouvernance.dz"
          className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
        />
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {pending ? 'Vérification en cours…' : "Accéder à l'administration"}
      </button>
    </form>
  )
}
