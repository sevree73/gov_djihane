'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
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
  values?: { email?: string }
} | undefined

// ── Citizen registration ─────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caractères)').max(100).trim(),
  email: z.string().email('Adresse email invalide').trim().toLowerCase(),
  password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  wilaya: z.string().optional(),
})

export type RegisterState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
    general?: string[]
  }
  values?: { name?: string; email?: string; wilaya?: string }
} | undefined

export async function registerCitoyen(
  _state: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    wilaya: (formData.get('wilaya') as string) || undefined,
  })

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      values: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        wilaya: formData.get('wilaya') as string,
      },
    }
  }

  const { name, email, password, wilaya } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: ['Cette adresse email est déjà utilisée.'] }, values: { name, email, wilaya } }
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: 'CITOYEN', wilaya: wilaya ?? null, isActive: true },
  })

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    wilaya: user.wilaya,
    ministere: user.ministere,
  })

  redirect('/carte')
}

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

  let user
  try {
    user = await prisma.user.findUnique({ where: { email } })
  } catch {
    return { errors: { general: ['Erreur de connexion. Veuillez réessayer.'] }, values: { email } }
  }

  if (!user || user.role !== 'CITOYEN' || !(await bcrypt.compare(password, user.password))) {
    return { errors: { general: ['Email ou mot de passe incorrect.'] }, values: { email } }
  }

  if (!user.isActive) {
    return { errors: { general: ['Votre compte est désactivé.'] }, values: { email } }
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    wilaya: user.wilaya,
    ministere: user.ministere,
  })

  redirect('/carte')
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
    return { errors: { general: ['Identifiants incorrects ou accès non autorisé.'] }, values: { email } }
  }

  if (!user.isActive) {
    return {
      errors: { general: ["Compte désactivé. Contactez l'administrateur système."] },
      values: { email },
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
  const session = await getSession()
  await deleteSession()
  redirect(session && session.role !== 'CITOYEN' ? '/admin/connexion' : '/connexion')
}
