import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ROLE_LABELS } from '@/lib/constants'
import type { Role } from '@/types'

export async function GET() {
  const session = await verifySession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      name: true,
      email: true,
      role: true,
      wilaya: true,
      ministere: true,
      isActive: true,
      createdAt: true,
    },
  })

  const rows = [
    ['Nom', 'Email', 'Rôle', 'Wilaya', 'Ministère', 'Actif', 'Date création'],
    ...users.map((u) => [
      u.name,
      u.email,
      ROLE_LABELS[u.role as Role] ?? u.role,
      u.wilaya ?? '',
      u.ministere ?? '',
      u.isActive ? 'Oui' : 'Non',
      new Date(u.createdAt).toLocaleDateString('fr-DZ'),
    ]),
  ]

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="utilisateurs_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
