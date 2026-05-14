import type { Metadata } from 'next'
import CitizenLoginForm from '@/components/citizen/LoginForm'

export const metadata: Metadata = {
  title: 'Connexion Citoyen — Gouvernance Territoriale',
}

export default function CitizenLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 shadow-lg mb-4">
            <span className="text-3xl">🏛</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gouvernance Territoriale</h1>
          <p className="mt-1 text-sm text-gray-500">Espace Citoyen</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Connexion</h2>
          <CitizenLoginForm />

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Vous êtes un agent institutionnel ?{' '}
              <a href="/admin/connexion" className="text-emerald-600 hover:underline font-medium">
                Espace Administration
              </a>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Plateforme Participative de Gouvernance Territoriale · Algérie
        </p>
      </div>
    </div>
  )
}
