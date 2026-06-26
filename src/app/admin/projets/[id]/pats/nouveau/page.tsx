import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import NouveauPATForm from './NouveauPATForm'

export default async function NouveauPATPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id: projectId } = await params

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true, wilaya: true },
  })
  if (!project) notFound()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/projets" className="hover:text-gray-700 transition-colors">Projets</Link>
        <span>›</span>
        <Link href={`/admin/projets/${projectId}/pats`} className="hover:text-gray-700 transition-colors">
          PATs
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-medium">Nouveau PAT</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Créer un PAT</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plan d&apos;Aménagement du Territoire pour{' '}
          <span className="font-medium text-gray-700">{project.title}</span>
          {project.wilaya ? ` — ${project.wilaya}` : ''}
        </p>
      </div>

      <NouveauPATForm projectId={projectId} wilaya={project.wilaya} />
    </div>
  )
}
