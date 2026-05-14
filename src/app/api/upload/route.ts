import { NextResponse } from 'next/server'

// Replaced by UploadThing — use /api/uploadthing for image uploads.
export function POST() {
  return NextResponse.json(
    { error: 'Endpoint remplacé. Utilisez /api/uploadthing.' },
    { status: 410 },
  )
}
