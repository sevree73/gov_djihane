import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        consultations: {
          where: { status: 'PUBLIEE' },
          select: { id: true, title: true, _count: { select: { votes: true } } },
        },
        _count: { select: { comments: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    return NextResponse.json({
      id: project.id,
      title: project.title,
      description: project.description,
      sector: project.sector,
      status: project.status,
      advancementRate: project.advancementRate,
      wilaya: project.wilaya,
      budget: project.budget ? project.budget.toString() : null,
      startDate: project.startDate,
      endDate: project.endDate,
      createdBy: project.createdBy.name,
      consultations: project.consultations,
      commentCount: project._count.comments,
    })
  } catch (err) {
    console.error('[GET /api/projets/[id]]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
