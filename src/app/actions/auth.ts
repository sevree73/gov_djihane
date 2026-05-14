'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import { ADMIN_ROLES } from '@/lib/constants'
import type { Role } from '@/types'

// ── Validation schema ────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email('Adresse email invalide').trim().toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
} | undefined

// ── Citizen login ────────────────────────────────────────────────────────────

export async function loginCitoyen(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || user.role !== 'CITOYEN' || !(await bcrypt.compare(password, user.password))) {
    return { errors: { general: ['Email ou mot de passe incorrect.'] } }
  }

  if (!user.isActive) {
    return { errors: { general: ['Votre compte est désactivé.'] } }
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    wilaya: user.wilaya,
    ministere: user.ministere,
  })

  redirect('/')
}

// ── Admin / Institutional login ──────────────────────────────────────────────

export async function loginAdmin(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (
    !user ||
    !ADMIN_ROLES.includes(user.role as Role) ||
    !(await bcrypt.compare(password, user.password))
  ) {
    return { errors: { general: ['Identifiants incorrects ou accès non autorisé.'] } }
  }

  if (!user.isActive) {
    return {
      errors: { general: ["Compte désactivé. Contactez l'administrateur système."] },
    }
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    wilaya: user.wilaya,
    ministere: user.ministere,
  })

  redirect('/admin/dashboard')
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await deleteSession()
  redirect('/connexion')
}
