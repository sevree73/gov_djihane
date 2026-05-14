'use client'

import { useState } from 'react'
import UserRoleSelect from './UserRoleSelect'
import UserFormModal, { type UserModalData } from './UserFormModal'
import type { Role } from '@/types'

interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  wilaya: string | null
  isActive: boolean
  createdAt: Date
}

interface UsersTableProps {
  users: UserRow[]
  sessionUserId: string
}

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; user: UserModalData }
  | null

export default function UsersTable({ users, sessionUserId }: UsersTableProps) {
  const [modal, setModal] = useState<ModalState>(null)

  function openCreate() {
    setModal({ mode: 'create' })
  }

  function openEdit(u: UserRow) {
    setModal({
      mode: 'edit',
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        wilaya: u.wilaya,
        isActive: u.isActive,
      },
    })
  }

  return (
    <>
      {/* "New user" button — rendered here so it shares modal state */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium text-gray-600">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Nom', 'Email', 'Rôle', 'Wilaya', 'Statut', 'Inscrit le', ''].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <UserRoleSelect
                        userId={u.id}
                        currentRole={u.role}
                        isSelf={u.id === sessionUserId}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{u.wilaya ?? '—'}</td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('fr-DZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <UserFormModal
          key={modal.mode === 'edit' ? modal.user.id : 'new'}
          mode={modal.mode}
          user={modal.mode === 'edit' ? modal.user : null}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
