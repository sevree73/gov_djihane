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
