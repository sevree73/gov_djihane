'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addComment, type AddCommentState } from '@/app/actions/comments'

type Comment = {
  id: string
  content: string
  createdAt: Date | string
  author: { name: string }
}

interface Props {
  projectId: string
  comments: Comment[]
  canComment: boolean
}

export default function CommentSection({ projectId, comments, canComment }: Props) {
  const [state, action, pending] = useActionState<AddCommentState, FormData>(
    addComment,
    undefined,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the textarea on successful submission
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state?.success])

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Commentaires
        <span className="text-sm font-normal text-gray-400">({comments.length})</span>
      </h2>

      {/* Comment list */}
      <div className="space-y-4 mb-8">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">
            Aucun commentaire pour l&apos;instant. Soyez le premier à commenter.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm mt-0.5">
                {c.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-800">{c.author.name}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('fr-DZ', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment form or login prompt */}
      {canComment ? (
        <form ref={formRef} action={action} className="space-y-3">
          <input type="hidden" name="projectId" value={projectId} />
          <textarea
            name="content"
            required
            minLength={1}
            maxLength={1000}
            rows={3}
            placeholder="Partagez votre avis sur ce projet…"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none transition"
          />
          {state?.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-xs text-emerald-600">Commentaire publié.</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {pending ? 'Publication…' : 'Publier le commentaire'}
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-sm text-gray-600">
            <a href="/connexion" className="text-emerald-600 hover:underline font-medium">
              Connectez-vous
            </a>{' '}
            pour laisser un commentaire.
          </p>
        </div>
      )}
    </div>
  )
}
