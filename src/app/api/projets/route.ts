import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ProjetRow = {
  id: string
  title: string
  sector: string
  status: string
  advancementRate: number
  wilaya: string | null
  lng: number | null
  lat: number | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wilaya = searchParams.get('wilaya')
  const status = searchParams.get('status')

  try {
    const params: unknown[] = []
    let p = 1
    let whereSql = `WHERE p.location IS NOT NULL`

    if (wilaya) { whereSql += ` AND p.wilaya = $${p++}`; params.push(wilaya) }
    if (status) { whereSql += ` AND p.status = '${status}'::"ProjectStatus"` }

    const sql = `
      SELECT
        p.id,
        p.title,
        p.sector,
        p.status::text,
        p."advancementRate",
        p.wilaya,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat
      FROM "Project" p
      ${whereSql}
      ORDER BY p."createdAt" DESC
      LIMIT 200
    `

    const rows = await prisma.$queryRawUnsafe<ProjetRow[]>(sql, ...params)

    const markers = rows.map((r) => ({
      id: r.id,
      title: r.title,
      sector: r.sector,
      status: r.status,
      advancementRate: r.advancementRate,
      wilaya: r.wilaya,
      location: { lng: r.lng ?? 0, lat: r.lat ?? 0 },
    }))

    return NextResponse.json({ markers })
  } catch (err) {
    console.error('[GET /api/projets]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
