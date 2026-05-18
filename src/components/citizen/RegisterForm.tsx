'use client'

import { useActionState } from 'react'
import { registerCitoyen, type RegisterState } from '@/app/actions/auth'
import { ALGERIAN_WILAYAS } from '@/lib/constants'

export default function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerCitoyen,
    undefined,
  )

  return (
    <form action={action} className="space-y-5">
      {state?.errors?.general && (
        <div className="bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-3">
          <p className="text-sm text-red-300">{state.errors.general[0]}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Nom complet <span className="text-red-400">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          defaultValue={state?.values?.name ?? ''}
          placeholder="Ex: Ahmed Benali"
          className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Adresse email <span className="text-red-400">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state?.values?.email ?? ''}
          placeholder="vous@exemple.dz"
          className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-400">{state.errors.email[0]}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Mot de passe <span className="text-red-400">*</span>
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimum 8 caractères"
          className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
        />
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-400">{state.errors.password[0]}</p>
        )}
      </div>

      {/* Wilaya */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Wilaya
          <span className="ml-1.5 text-xs text-gray-500 font-normal">(optionnel)</span>
        </label>
        <select
          name="wilaya"
          defaultValue={state?.values?.wilaya ?? ''}
          className="w-full rounded-xl bg-gray-800 border border-gray-700 text-white px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
        >
          <option value="">— Sélectionner votre wilaya —</option>
          {ALGERIAN_WILAYAS.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {pending ? 'Création du compte…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
