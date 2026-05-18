import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES } from '@/lib/constants'
import type { Role } from '@/types'

export async function GET(req: NextRequest) {
  const session = await verifySession()
  if (!session || !ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const wilaya = searchParams.get('wilaya') || undefined
  const q = searchParams.get('q')?.trim() || undefined

  const scopedWilaya =
    (['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE'] as Role[]).includes(session.role as Role)
      ? (session.wilaya ?? undefined)
      : undefined

  const projets = await prisma.project.findMany({
    where: {
      ...(scopedWilaya ? { wilaya: scopedWilaya } : wilaya ? { wilaya } : {}),
      ...(status ? { status: status as never } : {}),
      ...(q ? { OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]} : {}),
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const rows = [
    ['Titre', 'Secteur', 'Statut', 'Avancement (%)', 'Wilaya', 'Budget (DZD)', 'Début', 'Échéance', 'Créé par', 'Date création'],
    ...projets.map((p) => [
      p.title,
      p.sector,
      p.status,
      String(p.advancementRate),
      p.wilaya ?? '',
      p.budget ? String(p.budget) : '',
      p.startDate ? new Date(p.startDate).toLocaleDateString('fr-DZ') : '',
      p.endDate ? new Date(p.endDate).toLocaleDateString('fr-DZ') : '',
      p.createdBy.name,
      new Date(p.createdAt).toLocaleDateString('fr-DZ'),
    ]),
  ]

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="projets_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
