'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Role, TimestampString } from '@/types'

interface ManagedUser {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: TimestampString
  updatedAt: TimestampString
}

interface UserManagementProps {
  initialUsers: ManagedUser[]
  currentPage: number
  totalUsers: number
  pageSize: number
}

interface UserFormValues {
  name: string
  email: string
  password: string
  role: 'GURU' | 'SISWA'
}

interface ApiResult {
  data?: ManagedUser
  error?: string
  details?: Record<string, string>
}

const EMPTY_FORM: UserFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'GURU',
}

export default function UserManagement({
  initialUsers,
  currentPage,
  totalUsers,
  pageSize,
}: UserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [total, setTotal] = useState(totalUsers)
  const [form, setForm] = useState<UserFormValues>(EMPTY_FORM)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)

  useEffect(() => {
    setUsers(initialUsers)
    setTotal(totalUsers)
  }, [initialUsers, totalUsers])

  function startEditing(user: ManagedUser) {
    if (user.role === 'ADMIN') return
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setFieldErrors({})
    setFormError('')
    setNotice('')
  }

  function resetForm() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
    setNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFieldErrors({})
    setFormError('')
    setNotice('')

    try {
      await saveUser()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan user.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveUser() {
    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
      role: form.role,
    }
    if (form.password) payload.password = form.password

    const response = await fetch(
      editingUser ? `/api/users/${editingUser.id}` : '/api/users',
      {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    const result = (await response.json()) as ApiResult
    if (!response.ok) {
      setFieldErrors(result.details ?? {})
      setFormError(result.error ?? 'Gagal menyimpan data pengguna.')
      return
    }
    const savedUser = result.data
    if (!savedUser) throw new Error('Respons server tidak memuat data pengguna.')

    if (editingUser) {
      setUsers((current) =>
        current.map((user) => (user.id === savedUser.id ? savedUser : user))
      )
      setNotice('Data pengguna berhasil diperbarui.')
    } else {
      setTotal((current) => current + 1)
      setNotice('Pengguna berhasil dibuat.')
      if (currentPage === 1) setUsers((current) => [savedUser, ...current].slice(0, pageSize))
      else router.refresh()
    }
    setEditingUser(null)
    setForm(EMPTY_FORM)
  }

  async function toggleUserStatus(user: ManagedUser) {
    if (user.role === 'ADMIN') return
    const action = user.isActive ? 'menonaktifkan' : 'mengaktifkan'
    if (!window.confirm(`Apakah Anda yakin ingin ${action} akun ${user.name}?`)) return

    setPendingStatusId(user.id)
    setFormError('')
    setNotice('')
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      const result = (await response.json()) as ApiResult
      if (!response.ok) {
        setFormError(result.error ?? 'Gagal memperbarui status pengguna.')
        return
      }
      const savedUser = result.data
      if (!savedUser) throw new Error('Respons server tidak memuat data pengguna.')
      setUsers((current) =>
        current.map((entry) => (entry.id === savedUser.id ? savedUser : entry))
      )
      setNotice(`Status akun ${user.name} berhasil diperbarui.`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Gagal memperbarui status pengguna.')
    } finally {
      setPendingStatusId(null)
    }
  }

  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daftar Pengguna</h2>
            <p className="mt-1 text-sm text-gray-500">{total} akun terdaftar</p>
          </div>
          <span className="text-sm text-gray-500">
            Halaman {currentPage} dari {lastPage}
          </span>
        </div>

        {formError && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {notice}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-3 py-3">Nama</th>
                <th scope="col" className="px-3 py-3">Peran</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{roleLabel(user.role)}</td>
                  <td className="px-3 py-3">
                    <span className={user.isActive ? 'text-green-700' : 'text-gray-500'}>
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {user.role === 'ADMIN' ? (
                      <span className="text-xs text-gray-400">Akun Admin dilindungi</span>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                          className="font-medium text-blue-700 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingStatusId === user.id}
                          onClick={() => void toggleUserStatus(user)}
                          className="font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                        >
                          {pendingStatusId === user.id
                            ? 'Memproses...'
                            : user.isActive
                              ? 'Nonaktifkan'
                              : 'Aktifkan'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                    Belum ada pengguna pada halaman ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav aria-label="Navigasi halaman pengguna" className="mt-5 flex justify-between">
          {currentPage > 1 ? (
            <Link
              href={`/admin/dashboard/users?page=${currentPage - 1}`}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Sebelumnya
            </Link>
          ) : <span />}
          {currentPage < lastPage && (
            <Link
              href={`/admin/dashboard/users?page=${currentPage + 1}`}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Berikutnya
            </Link>
          )}
        </nav>
      </section>

      <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingUser ? 'Edit Pengguna' : 'Buat Pengguna'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {editingUser ? 'Kosongkan password jika tidak ingin mengubahnya.' : 'Buat akun baru untuk Guru atau Siswa.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <FormField
            id="name"
            label="Nama"
            value={form.name}
            error={fieldErrors.name}
            onChange={(name) => setForm((current) => ({ ...current, name }))}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            value={form.email}
            error={fieldErrors.email}
            onChange={(email) => setForm((current) => ({ ...current, email }))}
          />
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password {editingUser ? '(opsional)' : ''}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required={!editingUser}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              className={inputClass(Boolean(fieldErrors.password))}
            />
            {fieldErrors.password && <FieldError id="password-error" message={fieldErrors.password} />}
          </div>
          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">
              Peran
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value === 'SISWA' ? 'SISWA' : 'GURU',
                }))
              }
              className={inputClass(Boolean(fieldErrors.role))}
            >
              <option value="GURU">Guru</option>
              <option value="SISWA">Siswa</option>
            </select>
            {fieldErrors.role && <FieldError id="role-error" message={fieldErrors.role} />}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

function roleLabel(role: Role): string {
  if (role === 'ADMIN') return 'Admin'
  return role === 'GURU' ? 'Guru' : 'Siswa'
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`
}

function FormField({
  id,
  label,
  value,
  error,
  type = 'text',
  onChange,
}: {
  id: string
  label: string
  value: string
  error?: string
  type?: string
  onChange: (value: string) => void
}) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClass(Boolean(error))}
      />
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  )
}
