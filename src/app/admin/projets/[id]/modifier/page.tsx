import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateProjet } from '@/app/actions/projets'
import ProjetForm, { type ProjectInitialData } from '@/components/admin/ProjetForm'
import type { Role } from '@/types'
import type { GeoPoint } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export default async function ModifierProjetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await requireAdmin()

  const [project, locRows] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.$queryRawUnsafe<{ lat: number; lng: number }[]>(
      `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
       FROM "Project" WHERE id = $1 AND location IS NOT NULL`,
      id,
    ),
  ])

  if (!project) notFound()

  if (WILAYA_ROLES.includes(session.role as Role)) {
    if (project.wilaya && project.wilaya !== session.wilaya) notFound()
  }

  const initialLocation: GeoPoint | null = locRows[0] ?? null

  const initialData: ProjectInitialData = {
    title: project.title,
    description: project.description,
    sector: project.sector,
    status: project.status,
    priority: project.priority,
    wilaya: project.wilaya,
    ministere: project.ministere,
    budget: project.budget ? Number(project.budget) : null,
    budgetSpent: project.budgetSpent ? Number(project.budgetSpent) : null,
    advancementRate: project.advancementRate,
    startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : null,
    endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : null,
  }

  const updateAction = updateProjet.bind(null, id)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/dashboard" className="hover:text-gray-700">Tableau de bord</Link>
        <span>›</span>
        <Link href="/admin/projets" className="hover:text-gray-700">Projets</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{project.title}</span>
        <span>›</span>
        <span className="text-gray-900 font-medium">Modifier</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Modifier le projet</h1>
        <p className="text-sm text-gray-500 mt-1">{project.title}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <ProjetForm
          defaultWilaya={session.wilaya}
          serverAction={updateAction}
          initialData={initialData}
          initialLocation={initialLocation}
        />
      </div>
    </div>
  )
}
