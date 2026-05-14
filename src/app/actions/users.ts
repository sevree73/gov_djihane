'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/dal'
import type { Role } from '@/types'

export type UserFormState = {
  error?: string
  errors?: Record<string, string[]>
  success?: boolean
} | undefined

const ROLE_ENUM = z.enum([
  'SUPER_ADMIN', 'ADMIN_MINISTERE', 'ADMIN_WILAYA',
  'GESTIONNAIRE_TERRITORIAL', 'AGENT_TECHNIQUE', 'CITOYEN',
])

const CreateUserSchema = z.object({
  name:     z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  email:    z.string().email('Adresse email invalide').toLowerCase(),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  role:     ROLE_ENUM,
  wilaya:   z.string().optional(),
})

const UpdateUserSchema = z.object({
  name:     z.string().min(2, 'Nom requis (min 2 caractères)').max(100),
  email:    z.string().email('Adresse email invalide').toLowerCase(),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères').optional(),
  role:     ROLE_ENUM,
  wilaya:   z.string().optional(),
  isActive: z.string().optional().transform((v) => v !== 'false'),
})

export async function updateUserRole(
  userId: string,
  newRole: Role,
): Promise<{ error?: string }> {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') return { error: 'Réservé au Super Administrateur' }
  if (userId === session.userId) return { error: 'Vous ne pouvez pas modifier votre propre rôle' }
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } })
  revalidatePath('/admin/utilisateurs')
  return {}
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') return { error: 'Accès réservé au Super Administrateur' }

  const parsed = CreateUserSchema.safeParse({
    name:     formData.get('name'),
    email:    formData.get('email'),
    password: formData.get('password'),
    role:     formData.get('role'),
    wilaya:   (formData.get('wilaya') as string) || undefined,
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { name, email, password, role, wilaya } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Cette adresse email est déjà utilisée' }

  const hash = await bcrypt.hash(password, 12)
  await prisma.user.create({
    data: { name, email, password: hash, role: role as Role, wilaya: wilaya ?? null },
  })

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}

export async function updateUser(
  userId: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireAdmin()
  if (session.role !== 'SUPER_ADMIN') return { error: 'Accès réservé au Super Administrateur' }

  const rawPassword = (formData.get('password') as string) || undefined

  const parsed = UpdateUserSchema.safeParse({
    name:     formData.get('name'),
    email:    formData.get('email'),
    password: rawPassword,
    role:     formData.get('role'),
    wilaya:   (formData.get('wilaya') as string) || undefined,
    isActive: formData.get('isActive'),
  })
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors }

  const { name, email, password, role, wilaya, isActive } = parsed.data

  if (userId === session.userId && role !== 'SUPER_ADMIN') {
    return { error: 'Vous ne pouvez pas modifier votre propre rôle' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      role: role as Role,
      wilaya: wilaya ?? null,
      isActive,
      ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
    },
  })

  revalidatePath('/admin/utilisateurs')
  return { success: true }
}
