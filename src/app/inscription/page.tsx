import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import RegisterForm from '@/components/citizen/RegisterForm'

export default async function InscriptionPage() {
  const session = await getSession()
  if (session) redirect('/carte')

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Gouvernance Participative</p>
            <p className="text-gray-500 text-xs">République Algérienne</p>
          </div>
        </Link>
        <Link
          href="/connexion"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Déjà inscrit ? <span className="text-emerald-400 font-medium">Se connecter</span>
        </Link>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Créer un compte citoyen</h1>
            <p className="text-gray-400 text-sm">
              Rejoignez la plateforme et participez à la vie de votre wilaya.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <RegisterForm />
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            En créant un compte, vous acceptez que vos informations soient utilisées dans le cadre
            de la plateforme de gouvernance participative.
          </p>
        </div>
      </div>
    </div>
  )
}
