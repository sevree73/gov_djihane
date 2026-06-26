'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'

export type PATFormState = { error?: string; success?: boolean } | undefined

// ── PAT CRUD ─────────────────────────────────────────────────────────────────

export async function createPAT(
  _prev: PATFormState,
  formData: FormData,
): Promise<PATFormState> {
  await requireAdmin()

  const projectId = formData.get('projectId') as string
  const name = (formData.get('name') as string)?.trim()

  const parsed = z.string().min(3).max(200).safeParse(name)
  if (!parsed.success) return { error: 'Nom requis (3–200 caractères)' }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) return { error: 'Projet introuvable' }

  // Extract initial actions: action_text_0, action_deadline_0, …
  const avancement = Math.min(100, Math.max(0, parseInt(formData.get('avancement') as string) || 0))

  const initialActions: { text: string; deadline: Date }[] = []
  for (let i = 0; i < 100; i++) {
    const text = (formData.get(`action_text_${i}`) as string | null)?.trim()
    const deadlineStr = formData.get(`action_deadline_${i}`) as string | null
    if (!text && !deadlineStr) break
    if (!text || !deadlineStr) continue
    const deadline = new Date(deadlineStr)
    if (isNaN(deadline.getTime())) continue
    initialActions.push({ text, deadline })
  }

  await prisma.pAT.create({
    data: {
      name: parsed.data,
      avancement,
      projectId,
      actions: {
        create: initialActions.map((a) => ({ text: a.text, deadline: a.deadline, status: 'EN_COURS' })),
      },
    },
  })

  revalidatePath(`/admin/projets/${projectId}/pats`)
  redirect(`/admin/projets/${projectId}/pats`)
}

export async function updatePAT(formData: FormData): Promise<void> {
  await requireAdmin()

  const patId = formData.get('patId') as string
  const name = (formData.get('name') as string)?.trim()
  const avancement = Math.min(100, Math.max(0, parseInt(formData.get('avancement') as string) || 0))

  if (!name || name.length < 3) return

  const pat = await prisma.pAT.update({ where: { id: patId }, data: { name, avancement } })
  revalidatePath(`/admin/projets/${pat.projectId}/pats/${patId}`)
  revalidatePath(`/admin/projets/${pat.projectId}/pats`)
}

export async function deletePAT(formData: FormData): Promise<void> {
  await requireAdmin()

  const patId = formData.get('patId') as string
  const projectId = formData.get('projectId') as string

  await prisma.pAT.delete({ where: { id: patId } })
  revalidatePath(`/admin/projets/${projectId}/pats`)
  redirect(`/admin/projets/${projectId}/pats`)
}

// ── PAT Actions CRUD ─────────────────────────────────────────────────────────

export async function addPATAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const patId = formData.get('patId') as string
  const text = (formData.get('text') as string)?.trim()
  const deadlineStr = formData.get('deadline') as string

  if (!text || text.length < 2) return
  if (!deadlineStr) return

  const deadline = new Date(deadlineStr)
  if (isNaN(deadline.getTime())) return

  const pat = await prisma.pATAction.create({
    data: { patId, text, deadline, status: 'EN_COURS' },
    select: { pat: { select: { projectId: true } } },
  })

  revalidatePath(`/admin/projets/${pat.pat.projectId}/pats/${patId}`)
}

export async function updatePATActionStatus(formData: FormData): Promise<void> {
  await requireAdmin()

  const actionId = formData.get('actionId') as string
  const status = formData.get('status') as 'EN_COURS' | 'RETARD' | 'DONE'
  const patId = formData.get('patId') as string

  if (!['EN_COURS', 'RETARD', 'DONE'].includes(status)) return

  const action = await prisma.pATAction.update({
    where: { id: actionId },
    data: { status },
    select: { pat: { select: { projectId: true } } },
  })

  revalidatePath(`/admin/projets/${action.pat.projectId}/pats/${patId}`)
}

export async function deletePATAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const actionId = formData.get('actionId') as string
  const patId = formData.get('patId') as string

  const action = await prisma.pATAction.delete({
    where: { id: actionId },
    select: { pat: { select: { projectId: true } } },
  })

  revalidatePath(`/admin/projets/${action.pat.projectId}/pats/${patId}`)
}
