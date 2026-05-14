import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import ConsultationForm from '@/components/admin/ConsultationForm'

export default async function NouvelleConsultationPage() {
  await requireAdmin()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-gray-700 transition-colors">
          Tableau de bord
        </Link>
        <span>›</span>
        <Link href="/admin/consultations" className="hover:text-gray-700 transition-colors">
          Consultations
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Nouvelle consultation</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Créer une consultation publique</h1>
        <p className="text-sm text-gray-500 mt-1">
          Une consultation publiée est immédiatement visible et accessible aux citoyens.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <ConsultationForm />
      </div>
    </div>
  )
}
