import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WILAYA_CENTERS } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wilayaFilter = searchParams.get('wilaya') || undefined
  const statusFilter = searchParams.get('status') || undefined

  try {
    const rows = await prisma.project.findMany({
      where: {
        wilaya: wilayaFilter ? wilayaFilter : { not: null },
        ...(statusFilter ? { status: statusFilter as never } : {}),
      },
      select: {
        id: true,
        title: true,
        sector: true,
        status: true,
        advancementRate: true,
        wilaya: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const markers = rows
      .filter((r) => r.wilaya && WILAYA_CENTERS[r.wilaya])
      .map((r) => ({
        id: r.id,
        title: r.title,
        sector: r.sector,
        status: r.status,
        advancementRate: r.advancementRate,
        wilaya: r.wilaya,
        location: {
          lat: WILAYA_CENTERS[r.wilaya!].lat,
          lng: WILAYA_CENTERS[r.wilaya!].lng,
        },
      }))

    return NextResponse.json({ markers })
  } catch (err) {
    console.error('[GET /api/projets]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
