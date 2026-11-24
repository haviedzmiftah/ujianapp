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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Kolom Kiri: Tabel Data Pengguna */}
      <section className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Pengguna</h2>
            <p className="text-xs text-slate-500">{total} akun terdaftar dalam sistem</p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
            Halaman {currentPage} dari {lastPage}
          </span>
        </div>

        {formError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formError}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notice}</span>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3">Nama & Email</th>
                <th scope="col" className="px-4 py-3">Peran</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 ring-purple-700/10'
                          : user.role === 'GURU'
                          ? 'bg-sky-50 text-sky-700 ring-sky-700/10'
                          : 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'
                      }`}
                    >
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {user.role === 'ADMIN' ? (
                      <span className="text-xs text-slate-400 italic">Admin Utama</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                          className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pendingStatusId === user.id}
                          onClick={() => void toggleUserStatus(user)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {pendingStatusId === user.id
                            ? '...'
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
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Belum ada data pengguna pada halaman ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Nav */}
        <nav aria-label="Navigasi halaman pengguna" className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
          {currentPage > 1 ? (
            <Link
              href={`/admin/dashboard/users?page=${currentPage - 1}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Sebelumnya</span>
            </Link>
          ) : <span />}
          {currentPage < lastPage && (
            <Link
              href={`/admin/dashboard/users?page=${currentPage + 1}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <span>Berikutnya</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </nav>
      </section>

      {/* Kolom Kanan: Card Form Tambah / Edit Pengguna Dash UI */}
      <section className="h-fit rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-900">
            {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {editingUser
              ? 'Kosongkan password bila tidak ada perubahan.'
              : 'Daftarkan akun baru untuk Guru atau Siswa.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="name"
            label="Nama Lengkap"
            value={form.name}
            placeholder="misal: Budi Santoso"
            error={fieldErrors.name}
            onChange={(name) => setForm((current) => ({ ...current, name }))}
          />
          <FormField
            id="email"
            label="Alamat Email"
            type="email"
            placeholder="nama@sekolah.sch.id"
            value={form.email}
            error={fieldErrors.email}
            onChange={(email) => setForm((current) => ({ ...current, email }))}
          />
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-slate-700">
              Password {editingUser ? '(opsional)' : ''}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required={!editingUser}
              placeholder="Minimal 8 karakter"
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
            <label htmlFor="role" className="mb-1 block text-xs font-semibold text-slate-700">
              Peran Pengguna
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
              <option value="GURU">Guru (Pembuat Ujian)</option>
              <option value="SISWA">Siswa (Peserta Ujian)</option>
            </select>
            {fieldErrors.role && <FieldError id="role-error" message={fieldErrors.role} />}
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSaving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </button>
            {editingUser && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal Edit
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
  return `w-full rounded-lg border bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
    hasError ? 'border-red-400' : 'border-slate-200'
  }`
}

function FormField({
  id,
  label,
  value,
  placeholder,
  error,
  type = 'text',
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder?: string
  error?: string
  type?: string
  onChange: (value: string) => void
}) {
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
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
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
    </p>
  )
}
