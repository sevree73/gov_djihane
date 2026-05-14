import type { Metadata } from 'next'
import AdminLoginForm from '@/components/admin/LoginForm'
import { ROLE_LABELS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Connexion Administration — Gouvernance Territoriale',
}

const INSTITUTIONAL_ROLES = [
  'Super Administrateur',
  'Administrateur Ministère',
  'Administrateur Wilaya',
  'Gestionnaire Territorial',
  'Agent Technique',
]

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-700 border border-gray-600 shadow-lg mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Administration Institutionnelle</h1>
          <p className="mt-1 text-sm text-gray-400">Accès réservé aux agents autorisés</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Connexion sécurisée</h2>
            <p className="text-xs text-gray-400 mt-1">
              Vos identifiants sont chiffrés et sécurisés.
            </p>
          </div>

          <AdminLoginForm />

          {/* Role legend */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2 font-medium">Rôles institutionnels :</p>
            <div className="flex flex-wrap gap-1.5">
              {INSTITUTIONAL_ROLES.map((r) => (
                <span
                  key={r}
                  className="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-0.5"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 text-center">
            <a href="/connexion" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              ← Espace Citoyen
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Gouvernance Territoriale Participative · Algérie
        </p>
      </div>
    </div>
  )
}
