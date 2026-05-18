'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import { getSession } from '@/lib/session'

// ── Admin: create consultation ───────────────────────────────────────────────

const CreateSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  status: z.enum(['BROUILLON', 'PUBLIEE']),
  projectId: z.string().optional(),
})

export type ConsultationFormState = { error?: string; success?: boolean } | undefined

export async function createConsultation(
  _prev: ConsultationFormState,
  formData: FormData,
): Promise<ConsultationFormState> {
  const session = await requireAdmin()

  const parsed = CreateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status') || 'BROUILLON',
    projectId: (formData.get('projectId') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  // Extract dynamic questions: question_0, question_1, …
  const questions: string[] = []
  for (let i = 0; i < 20; i++) {
    const text = (formData.get(`question_${i}`) as string | null)?.trim()
    if (!text) break
    if (text.length > 500) return { error: `Question ${i + 1} trop longue (max 500 caractères)` }
    questions.push(text)
  }
  if (questions.length === 0) {
    return { error: 'Ajoutez au moins une question' }
  }

  const { title, description, status, projectId } = parsed.data

  await prisma.consultation.create({
    data: {
      title,
      description,
      status: status as 'BROUILLON' | 'PUBLIEE',
      publishedById: session.userId,
      ...(projectId ? { projectId } : {}),
      questions: {
        create: questions.map((text, order) => ({ text, order })),
      },
    },
  })

  revalidatePath('/admin/consultations')
  redirect('/admin/consultations')
}

// ── Admin: publish / close ───────────────────────────────────────────────────

export async function publishConsultation(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id') as string
  await prisma.consultation.update({
    where: { id },
    data: { status: 'PUBLIEE' },
  })
  revalidatePath('/admin/consultations')
}

export async function closeConsultation(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id') as string
  await prisma.consultation.update({
    where: { id },
    data: { status: 'CLOTUREE', closedAt: new Date() },
  })
  revalidatePath('/admin/consultations')
}

export async function reopenConsultation(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id') as string
  await prisma.consultation.update({
    where: { id },
    data: { status: 'PUBLIEE', closedAt: null },
  })
  revalidatePath('/admin/consultations')
}

// ── Admin: edit consultation ─────────────────────────────────────────────────

export type UpdateConsultationState = { error?: string; success?: boolean } | undefined

export async function updateConsultationMeta(
  _prev: UpdateConsultationState,
  formData: FormData,
): Promise<UpdateConsultationState> {
  await requireAdmin()
  const id = formData.get('id') as string

  const parsed = z.object({
    title: z.string().min(5).max(200),
    description: z.string().min(10).max(2000),
  }).safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  await prisma.consultation.update({
    where: { id },
    data: { title: parsed.data.title, description: parsed.data.description },
  })

  revalidatePath(`/admin/consultations/${id}/modifier`)
  revalidatePath('/admin/consultations')
  return { success: true }
}

export async function deleteConsultationQuestion(formData: FormData): Promise<void> {
  await requireAdmin()
  const questionId = formData.get('questionId') as string
  const consultationId = formData.get('consultationId') as string

  await prisma.consultationQuestion.delete({ where: { id: questionId } })
  revalidatePath(`/admin/consultations/${consultationId}/modifier`)
}

export async function addConsultationQuestion(formData: FormData): Promise<void> {
  await requireAdmin()
  const consultationId = formData.get('consultationId') as string
  const text = (formData.get('text') as string)?.trim()

  if (!text || text.length < 2 || text.length > 500) return

  const agg = await prisma.consultationQuestion.aggregate({
    where: { consultationId },
    _max: { order: true },
  })

  await prisma.consultationQuestion.create({
    data: { consultationId, text, order: (agg._max.order ?? 0) + 1 },
  })

  revalidatePath(`/admin/consultations/${consultationId}/modifier`)
}

export async function deleteConsultationResponse(formData: FormData): Promise<void> {
  await requireAdmin()
  const voteId = formData.get('voteId') as string
  const consultationId = formData.get('consultationId') as string

  const vote = await prisma.vote.findUnique({ where: { id: voteId } })
  if (!vote) return

  const questions = await prisma.consultationQuestion.findMany({
    where: { consultationId },
    select: { id: true },
  })

  await prisma.$transaction([
    prisma.questionAnswer.deleteMany({
      where: { userId: vote.userId, questionId: { in: questions.map((q) => q.id) } },
    }),
    prisma.vote.delete({ where: { id: voteId } }),
  ])

  revalidatePath(`/admin/consultations/${consultationId}/reponses`)
}

export async function addAdminConsultationComment(formData: FormData): Promise<void> {
  const session = await requireAdmin()
  const consultationId = formData.get('consultationId') as string
  const content = (formData.get('content') as string)?.trim()

  if (!content || content.length < 2 || content.length > 1000) return

  await prisma.comment.create({
    data: { content, authorId: session.userId, consultationId },
  })

  revalidatePath(`/admin/consultations/${consultationId}/reponses`)
}

// ── Citizen: submit vote + answers ───────────────────────────────────────────

export type ParticipationState = { error?: string; success?: boolean } | undefined

export async function submitParticipation(
  _prev: ParticipationState,
  formData: FormData,
): Promise<ParticipationState> {
  const session = await getSession()
  if (!session || session.role !== 'CITOYEN') {
    return { error: 'Connexion requise. Veuillez vous connecter en tant que citoyen.' }
  }

  const consultationId = formData.get('consultationId') as string
  if (!consultationId) return { error: 'Consultation introuvable' }

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { questions: true },
  })
  if (!consultation || consultation.status !== 'PUBLIEE') {
    return { error: 'Cette consultation n\'est pas disponible' }
  }

  // Check already voted
  const existingVote = await prisma.vote.findUnique({
    where: { consultationId_userId: { consultationId, userId: session.userId } },
  })
  if (existingVote) {
    return { error: 'Vous avez déjà participé à cette consultation' }
  }

  const voteStr = formData.get('vote') as string | null
  const voteValue = voteStr !== null && voteStr !== '' ? parseInt(voteStr) : null

  if (voteValue === null) {
    return { error: 'Veuillez choisir une position (Pour / Neutre / Contre)' }
  }
  if (![-1, 0, 1].includes(voteValue)) {
    return { error: 'Valeur de vote invalide' }
  }

  const answerOps = consultation.questions.flatMap((q) => {
    const answer = (formData.get(`answer_${q.id}`) as string | null)?.trim()
    if (!answer) return []
    return [
      prisma.questionAnswer.create({
        data: { questionId: q.id, userId: session.userId, value: answer },
      }),
    ]
  })

  await prisma.$transaction([
    prisma.vote.create({
      data: { consultationId, userId: session.userId, value: voteValue },
    }),
    ...answerOps,
  ])

  revalidatePath(`/consultations/${consultationId}`)
  return { success: true }
}
