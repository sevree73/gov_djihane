import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_SIZE_BYTES = 4 * 1024 * 1024 // 4 MB
const MAX_FILES = 3

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  const rawFiles = formData.getAll('files')
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers` }, { status: 400 })
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: `Type non autorisé: ${file.type}` }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 4 Mo)' }, { status: 400 })
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  const urls: string[] = []
  for (const file of files) {
    const ext = extname(file.name).toLowerCase() || '.jpg'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(UPLOAD_DIR, safeName), buffer)
    urls.push(`/uploads/${safeName}`)
  }

  return NextResponse.json({ urls })
}
