import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ADMIN_ROLES } from '@/lib/constants'
import type { Role } from '@/types'

export async function GET() {
  const session = await verifySession()
  if (!session || !ADMIN_ROLES.includes(session.role as Role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const consultations = await prisma.consultation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { title: true } },
      publishedBy: { select: { name: true } },
      _count: { select: { questions: true, votes: true } },
    },
  })

  const STATUS_LABELS: Record<string, string> = {
    BROUILLON: 'Brouillon',
    PUBLIEE: 'Publiée',
    CLOTUREE: 'Clôturée',
  }

  const rows = [
    ['Titre', 'Statut', 'Projet lié', 'Questions', 'Réponses', 'Publié par', 'Date création', 'Date clôture'],
    ...consultations.map((c) => [
      c.title,
      STATUS_LABELS[c.status] ?? c.status,
      c.project?.title ?? '',
      String(c._count.questions),
      String(c._count.votes),
      c.publishedBy.name,
      new Date(c.createdAt).toLocaleDateString('fr-DZ'),
      c.closedAt ? new Date(c.closedAt).toLocaleDateString('fr-DZ') : '',
    ]),
  ]

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="consultations_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
