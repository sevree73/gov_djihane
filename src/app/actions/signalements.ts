'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import type { Role, SignalementStatus } from '@/types'

const WILAYA_ROLES: Role[] = ['ADMIN_WILAYA', 'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE']

const StatusSchema = z.object({
  signalementId: z.string().min(1),
  newStatus: z.enum(['RECU', 'EN_COURS', 'PRIS_EN_CHARGE', 'RESOLU', 'REJETE']),
  comment: z.string().max(500).optional(),
})

export type UpdateStatusState = { error?: string; success?: boolean } | undefined

export async function updateSignalementStatus(
  _prev: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  const session = await requireAdmin()

  const parsed = StatusSchema.safeParse({
    signalementId: formData.get('signalementId'),
    newStatus: formData.get('newStatus'),
    comment: formData.get('comment') || undefined,
  })

  if (!parsed.success) {
    return { error: 'Données invalides' }
  }

  const { signalementId, newStatus, comment } = parsed.data

  const signalement = await prisma.signalement.findUnique({
    where: { id: signalementId },
    select: { id: true, status: true, wilaya: true },
  })

  if (!signalement) return { error: 'Signalement introuvable' }

  // Wilaya-scoped roles can only update their own wilaya's signalements
  if (WILAYA_ROLES.includes(session.role as Role)) {
    if (signalement.wilaya && signalement.wilaya !== session.wilaya) {
      return { error: 'Accès non autorisé à ce signalement' }
    }
  }

  const fullSignalement = await prisma.signalement.findUnique({
    where: { id: signalementId },
    select: { title: true, citizenId: true },
  })

  const STATUS_LABELS: Record<string, string> = {
    EN_COURS: 'En cours de traitement',
    PRIS_EN_CHARGE: 'Pris en charge',
    RESOLU: 'Résolu',
    REJETE: 'Rejeté',
  }

  await prisma.$transaction([
    prisma.signalement.update({
      where: { id: signalementId },
      data: { status: newStatus as SignalementStatus, updatedAt: new Date() },
    }),
    prisma.signalementHistory.create({
      data: {
        signalementId,
        oldStatus: signalement.status,
        newStatus: newStatus as SignalementStatus,
        comment: comment ?? null,
        changedById: session.userId,
      },
    }),
    // Notify the citizen
    prisma.notification.create({
      data: {
        userId: fullSignalement!.citizenId,
        type: 'SIGNALEMENT_STATUS',
        title: 'Votre signalement a été mis à jour',
        message: `"${fullSignalement!.title}" — ${STATUS_LABELS[newStatus] ?? newStatus}${comment ? ` : ${comment}` : ''}`,
        link: '/',
        signalementId,
      },
    }),
  ])

  revalidatePath('/admin/signalements')
  revalidatePath('/admin/dashboard')
  return { success: true }
}
