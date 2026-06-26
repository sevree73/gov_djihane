'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAdmin, type LoginState } from '@/app/actions/auth'

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAdmin, undefined)
  const errors = state?.errors
  const values = state?.values

  return (
    <form action={action} className="space-y-4">
      {errors?.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{errors.general[0]}</p>
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Identifiant
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={values?.email ?? ''}
          placeholder="nom.prenom@wilaya.gov.dz"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
        {errors?.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Mot de passe
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
        {errors?.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">ou</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <Link
        href="/carte"
        className="block text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Accès public à la carte et aux actions, sans compte
      </Link>
    </form>
  )
}
