import Link from 'next/link'
import { requireAdmin } from '@/lib/dal'
import ProjetForm from '@/components/admin/ProjetForm'

export default async function NouveauProjetPage() {
  const session = await requireAdmin()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-gray-700 transition-colors">Tableau de bord</Link>
        <span>›</span>
        <Link href="/admin/projets" className="hover:text-gray-700 transition-colors">Projets</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Nouveau projet</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Créer un projet territorial</h1>
        <p className="text-sm text-gray-500 mt-1">
          Les projets apparaîtront sur la carte publique une fois localisés.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <ProjetForm defaultWilaya={session.wilaya} />
      </div>
    </div>
  )
}
