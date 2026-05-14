'use client'

import { useState, useRef } from 'react'

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void
  maxFiles?: number
}

type UploadedFile = {
  name: string
  url: string        // final server URL, empty until upload completes
  previewUrl: string // local blob URL for instant preview
}

export default function ImageUploader({ onUploadComplete, maxFiles = 3 }: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return
    const remaining = maxFiles - files.length
    if (remaining <= 0) return

    const newRawFiles = Array.from(selected).slice(0, remaining)

    // Immediate local previews
    const withPreviews: UploadedFile[] = newRawFiles.map((f) => ({
      name: f.name,
      url: '',
      previewUrl: URL.createObjectURL(f),
    }))
    setFiles((prev) => [...prev, ...withPreviews])
    setUploading(true)
    setError(null)

    try {
      const fd = new FormData()
      for (const f of newRawFiles) fd.append('files', f)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Erreur serveur (${res.status})`)
      }

      const { urls } = (await res.json()) as { urls: string[] }

      setFiles((prev) => {
        // Replace the placeholder entries we just added with their final URLs
        const updated = [...prev]
        let urlIdx = 0
        for (let i = 0; i < updated.length; i++) {
          if (!updated[i].url && urlIdx < urls.length) {
            updated[i] = { ...updated[i], url: urls[urlIdx++] }
          }
        }
        onUploadComplete(updated.filter((f) => f.url).map((f) => f.url))
        return updated
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload")
      // Remove the placeholder previews that failed
      setFiles((prev) => prev.filter((f) => f.url))
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeFile(idx: number) {
    const updated = files.filter((_, i) => i !== idx)
    setFiles(updated)
    onUploadComplete(updated.filter((f) => f.url).map((f) => f.url))
  }

  const canAdd = files.length < maxFiles && !uploading

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-600 bg-gray-700"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.previewUrl} alt={f.name} className="w-full h-full object-cover" />

              {/* Upload spinner overlay */}
              {!f.url && uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Remove button (only once upload is confirmed) */}
              {f.url && (
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-xs leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-500 hover:border-emerald-500 text-gray-400 hover:text-emerald-400 rounded-lg text-sm transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {files.length === 0
            ? `Ajouter des photos (max ${maxFiles})`
            : `Ajouter une photo (${files.length}/${maxFiles})`}
        </button>
      )}

      {uploading && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <span className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Upload en cours…
        </p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
