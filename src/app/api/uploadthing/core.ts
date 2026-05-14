import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getSession } from '@/lib/session'

const f = createUploadthing()

export const ourFileRouter = {
  signalementImages: f({ image: { maxFileSize: '4MB', maxFileCount: 3 } })
    .middleware(async () => {
      const session = await getSession()
      if (!session) throw new Error('Non authentifié')
      return { userId: session.userId }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
