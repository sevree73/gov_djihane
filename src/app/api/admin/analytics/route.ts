import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ADMIN_ROLES } from '@/lib/constants'
import type { Role } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export async function GET() {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const wilayaFilter =
    WILAYA_ROLES.includes(session.role as Role) && session.wilaya
      ? { wilaya: session.wilaya }
      : {}

  const [
    signalementsByCategory,
    signalementsByStatus,
    projectStats,
    totalCitizens,
    totalSignalements,
    totalProjets,
  ] = await Promise.all([
    prisma.signalement.groupBy({
      by: ['category'],
      _count: { id: true },
      where: wilayaFilter,
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.signalement.groupBy({
      by: ['status'],
      _count: { id: true },
      where: wilayaFilter,
    }),
    prisma.project.aggregate({
      _avg: { advancementRate: true },
      _count: { id: true },
      where: wilayaFilter,
    }),
    prisma.user.count({ where: { role: 'CITOYEN' } }),
    prisma.signalement.count({ where: wilayaFilter }),
    prisma.project.count({ where: wilayaFilter }),
  ])

  return NextResponse.json({
    signalementsByCategory: signalementsByCategory.map((r) => ({
      category: r.category,
      count: r._count.id,
    })),
    signalementsByStatus: signalementsByStatus.map((r) => ({
      status: r.status,
      count: r._count.id,
    })),
    avgAdvancementRate: Math.round(projectStats._avg.advancementRate ?? 0),
    totalCitizens,
    totalSignalements,
    totalProjets,
    activeProjects: projectStats._count.id,
  })
}
