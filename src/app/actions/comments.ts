'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const CommentSchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1, 'Le commentaire ne peut pas être vide').max(1000),
})

export type AddCommentState = { error?: string; success?: boolean } | undefined

export async function addComment(
  _prev: AddCommentState,
  formData: FormData,
): Promise<AddCommentState> {
  const session = await getSession()
  if (!session) return { error: 'Vous devez être connecté pour commenter' }

  const parsed = CommentSchema.safeParse({
    projectId: formData.get('projectId'),
    content: (formData.get('content') as string)?.trim(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Contenu invalide' }
  }

  const { projectId, content } = parsed.data

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  })
  if (!project) return { error: 'Projet introuvable' }

  await prisma.comment.create({
    data: { content, authorId: session.userId, projectId },
  })

  revalidatePath(`/projets/${projectId}`)
  return { success: true }
}
