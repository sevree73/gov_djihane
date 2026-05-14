import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const CreateSignalementSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum([
    'URBANISME', 'TRANSPORT', 'ENVIRONNEMENT', 'VOIRIE',
    'EAU', 'DECHETS', 'EQUIPEMENTS_PUBLICS', 'SANTE', 'EDUCATION',
  ]),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  wilaya: z.string().optional(),
  commune: z.string().optional(),
  mediaUrls: z.array(z.string().min(1)).max(3).optional(),
})

export const dynamic = 'force-dynamic'

type SignalementRow = {
  id: string
  title: string
  category: string
  status: string
  wilaya: string | null
  createdAt: Date
  lng: number | null
  lat: number | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const wilaya = searchParams.get('wilaya')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500)

  try {
    // Build WHERE clause with positional params for user-supplied filters
    const params: unknown[] = []
    let p = 1
    let whereSql =
      `WHERE s.location IS NOT NULL`

    if (wilaya) { whereSql += ` AND s.wilaya = $${p++}`; params.push(wilaya) }
    // category and status values are Zod-validated enums — safe to cast inline
    if (category) { whereSql += ` AND s.category = '${category}'::"SignalementCategory"` }
    if (status)   { whereSql += ` AND s.status   = '${status}'::"SignalementStatus"` }

    const sql = `
      SELECT
        s.id,
        s.title,
        s.category::text,
        s.status::text,
        s.wilaya,
        s."createdAt",
        ST_X(s.location::geometry) AS lng,
        ST_Y(s.location::geometry) AS lat
      FROM "Signalement" s
      ${whereSql}
      ORDER BY s."createdAt" DESC
      LIMIT ${limit}
    `

    const rows = await prisma.$queryRawUnsafe<SignalementRow[]>(sql, ...params)

    const markers = rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      status: r.status,
      wilaya: r.wilaya,
      createdAt: r.createdAt,
      location: { lng: r.lng ?? 0, lat: r.lat ?? 0 },
    }))

    return NextResponse.json({ markers })
  } catch (err) {
    console.error('[GET /api/signalements]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const parsed = CreateSignalementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { title, description, category, lng, lat, wilaya, commune, mediaUrls } = parsed.data

  try {
    // Insert with PostGIS point — can't use Prisma ORM for geometry fields
    const result = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "Signalement" (
        id, title, description, category, status,
        location, wilaya, commune, "mediaUrls",
        "citizenId", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${title},
        ${description},
        ${category}::"SignalementCategory",
        'RECU'::"SignalementStatus",
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${wilaya ?? null},
        ${commune ?? null},
        ARRAY[]::TEXT[],
        ${session.userId},
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const id = result[0].id

    // Update mediaUrls separately via Prisma ORM (handles TEXT[] natively)
    if (mediaUrls && mediaUrls.length > 0) {
      await prisma.signalement.update({
        where: { id },
        data: { mediaUrls },
      })
    }

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/signalements]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
