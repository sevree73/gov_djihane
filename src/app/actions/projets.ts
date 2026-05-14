'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import type { Role, ProjectStatus } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

export type ProjetFormState =
  | { errors?: Record<string, string[]>; general?: string }
  | undefined

const ProjetSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(3000),
  sector: z.string().min(2).max(100),
  wilaya: z.string().optional(),
  ministere: z.string().optional(),
  status: z.enum(['EN_ATTENTE', 'EN_COURS', 'SUSPENDU', 'TERMINE', 'ANNULE']),
  budget: z.coerce.number().min(0).optional(),
  budgetSpent: z.coerce.number().min(0).optional(),
  advancementRate: z.coerce.number().min(0).max(100).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
})

export async function createProjet(
  _prev: ProjetFormState,
  formData: FormData,
): Promise<ProjetFormState> {
  const session = await requireAdmin()

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    sector: formData.get('sector'),
    wilaya: formData.get('wilaya') || undefined,
    ministere: formData.get('ministere') || undefined,
    status: formData.get('status') ?? 'EN_ATTENTE',
    budget: formData.get('budget') || undefined,
    budgetSpent: formData.get('budgetSpent') || undefined,
    advancementRate: formData.get('advancementRate') ?? 0,
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
    lat: formData.get('lat') || undefined,
    lng: formData.get('lng') || undefined,
  }

  const parsed = ProjetSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data

  // Wilaya-scoped roles can only create projects for their wilaya
  if (WILAYA_ROLES.includes(session.role as Role)) {
    if (d.wilaya && d.wilaya !== session.wilaya) {
      return { general: 'Vous ne pouvez créer des projets que pour votre wilaya' }
    }
    // Force wilaya to their own if not provided
    if (!d.wilaya) d.wilaya = session.wilaya ?? undefined
  }

  try {
    if (d.lat !== undefined && d.lng !== undefined) {
      await prisma.$queryRaw`
        INSERT INTO "Project" (
          id, title, description, sector, wilaya, ministere, status,
          budget, "budgetSpent", "advancementRate",
          "startDate", "endDate", location,
          "createdById", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${d.title}, ${d.description}, ${d.sector},
          ${d.wilaya ?? null}, ${d.ministere ?? null},
          ${d.status}::"ProjectStatus",
          ${d.budget ?? null}, ${d.budgetSpent ?? null}, ${d.advancementRate},
          ${d.startDate ? new Date(d.startDate) : null},
          ${d.endDate ? new Date(d.endDate) : null},
          ST_SetSRID(ST_MakePoint(${d.lng}, ${d.lat}), 4326),
          ${session.userId}, NOW(), NOW()
        )
      `
    } else {
      await prisma.project.create({
        data: {
          title: d.title,
          description: d.description,
          sector: d.sector,
          wilaya: d.wilaya ?? null,
          ministere: d.ministere ?? null,
          status: d.status as ProjectStatus,
          budget: d.budget ?? null,
          budgetSpent: d.budgetSpent ?? null,
          advancementRate: d.advancementRate,
          startDate: d.startDate ? new Date(d.startDate) : null,
          endDate: d.endDate ? new Date(d.endDate) : null,
          createdById: session.userId,
        },
      })
    }
  } catch (err) {
    console.error('[createProjet]', err)
    return { general: 'Erreur lors de la création du projet' }
  }

  revalidatePath('/admin/projets')
  revalidatePath('/admin/dashboard')
  redirect('/admin/projets')
}

export async function updateProjetStatus(
  projetId: string,
  newStatus: ProjectStatus,
  advancementRate?: number,
) {
  const session = await requireAdmin()

  const projet = await prisma.project.findUnique({
    where: { id: projetId },
    select: { id: true, wilaya: true },
  })

  if (!projet) return { error: 'Projet introuvable' }

  if (WILAYA_ROLES.includes(session.role as Role)) {
    if (projet.wilaya && projet.wilaya !== session.wilaya) {
      return { error: 'Accès non autorisé' }
    }
  }

  await prisma.project.update({
    where: { id: projetId },
    data: {
      status: newStatus,
      ...(advancementRate !== undefined ? { advancementRate } : {}),
      updatedAt: new Date(),
    },
  })

  revalidatePath('/admin/projets')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateProjet(
  projectId: string,
  _prev: ProjetFormState,
  formData: FormData,
): Promise<ProjetFormState> {
  const session = await requireAdmin()

  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    sector: formData.get('sector'),
    wilaya: formData.get('wilaya') || undefined,
    ministere: formData.get('ministere') || undefined,
    status: formData.get('status') ?? 'EN_ATTENTE',
    budget: formData.get('budget') || undefined,
    budgetSpent: formData.get('budgetSpent') || undefined,
    advancementRate: formData.get('advancementRate') ?? 0,
    startDate: formData.get('startDate') || undefined,
    endDate: formData.get('endDate') || undefined,
    lat: formData.get('lat') || undefined,
    lng: formData.get('lng') || undefined,
  }

  const parsed = ProjetSchema.safeParse(raw)
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const d = parsed.data

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { wilaya: true },
  })
  if (!existing) return { general: 'Projet introuvable' }

  if (WILAYA_ROLES.includes(session.role as Role)) {
    if (existing.wilaya && existing.wilaya !== session.wilaya) {
      return { general: 'Accès non autorisé' }
    }
    if (d.wilaya && d.wilaya !== session.wilaya) {
      return { general: 'Vous ne pouvez modifier des projets que pour votre wilaya' }
    }
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        title: d.title,
        description: d.description,
        sector: d.sector,
        wilaya: d.wilaya ?? null,
        ministere: d.ministere ?? null,
        status: d.status as ProjectStatus,
        budget: d.budget ?? null,
        budgetSpent: d.budgetSpent ?? null,
        advancementRate: d.advancementRate,
        startDate: d.startDate ? new Date(d.startDate) : null,
        endDate: d.endDate ? new Date(d.endDate) : null,
        updatedAt: new Date(),
      },
    })

    if (d.lat !== undefined && d.lng !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Project" SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        d.lng, d.lat, projectId,
      )
    }
  } catch (err) {
    console.error('[updateProjet]', err)
    return { general: 'Erreur lors de la mise à jour du projet' }
  }

  revalidatePath('/admin/projets')
  revalidatePath('/admin/dashboard')
  redirect('/admin/projets')
}
