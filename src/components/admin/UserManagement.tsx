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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)

  // Filter & Search local state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'GURU' | 'SISWA'>('ALL')

  useEffect(() => {
    setUsers(initialUsers)
    setTotal(totalUsers)
  }, [initialUsers, totalUsers])

  function openCreateModal() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  function startEditing(user: ManagedUser) {
    if (user.role === 'ADMIN') return
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role })
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
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
      setNotice(`Data pengguna "${savedUser.name}" berhasil diperbarui.`)
    } else {
      setTotal((current) => current + 1)
      setNotice(`Pengguna baru "${savedUser.name}" berhasil ditambahkan.`)
      if (currentPage === 1) setUsers((current) => [savedUser, ...current].slice(0, pageSize))
      else router.refresh()
    }

    closeModal()
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

  // Filtered users on client side
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi */}
      {notice && (
        <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-emerald-600 hover:text-emerald-900 text-sm font-semibold p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Full-width Data Table Card */}
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Akun Pengguna</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {total} akun terdaftar &bull; Halaman {currentPage} dari {lastPage}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Peran */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="ALL">Semua Peran</option>
              <option value="GURU">Guru</option>
              <option value="SISWA">Siswa</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Pencarian */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tombol Tambah Pengguna */}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Pengguna</span>
            </button>
          </div>
        </div>

        {/* Full-width Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Nama & Email</th>
                <th scope="col" className="px-6 py-3.5">Peran</th>
                <th scope="col" className="px-6 py-3.5">Status Akun</th>
                <th scope="col" className="px-6 py-3.5">Terdaftar Sejak</th>
                <th scope="col" className="px-6 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        user.isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === 'ADMIN' ? (
                      <span className="text-xs text-slate-400 italic">Akun Terlindungi</span>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(user)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={pendingStatusId === user.id}
                          onClick={() => void toggleUserStatus(user)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs cursor-pointer ${
                            user.isActive
                              ? 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/70'
                              : 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/70'
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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm font-semibold text-slate-700">Tidak ada data pengguna ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter peran.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Menampilkan {filteredUsers.length} pengguna dari total {total}
          </div>
          <nav aria-label="Navigasi halaman pengguna" className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={`/admin/dashboard/users?page=${currentPage - 1}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Sebelumnya</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                Sebelumnya
              </span>
            )}
            {currentPage < lastPage ? (
              <Link
                href={`/admin/dashboard/users?page=${currentPage + 1}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs"
              >
                <span>Berikutnya</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/50 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                Berikutnya
              </span>
            )}
          </nav>
        </div>
      </section>

      {/* Modal Dialog Form Tambah / Edit Pengguna (Opsi A) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Modal Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Card Content */}
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  {editingUser ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser
                      ? 'Perbarui informasi akun. Kosongkan password bila tidak diganti.'
                      : 'Daftarkan akun baru untuk Guru atau Siswa ke sistem ujian.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body Form */}
            {formError && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField
                id="modal-name"
                label="Nama Lengkap"
                placeholder="misal: Budi Pratama, S.Pd"
                value={form.name}
                error={fieldErrors.name}
                onChange={(name) => setForm((current) => ({ ...current, name }))}
              />
              <FormField
                id="modal-email"
                label="Alamat Email"
                type="email"
                placeholder="nama@sekolah.sch.id"
                value={form.email}
                error={fieldErrors.email}
                onChange={(email) => setForm((current) => ({ ...current, email }))}
              />
              <div>
                <label htmlFor="modal-password" className="mb-1 block text-xs font-semibold text-slate-700">
                  Password {editingUser ? '(opsional)' : ''}
                </label>
                <input
                  id="modal-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required={!editingUser}
                  placeholder={editingUser ? 'Biarkan kosong jika tidak diubah' : 'Minimal 8 karakter'}
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
                <label htmlFor="modal-role" className="mb-1 block text-xs font-semibold text-slate-700">
                  Peran Akun
                </label>
                <select
                  id="modal-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value === 'SISWA' ? 'SISWA' : 'GURU',
                    }))
                  }
                  className={inputClass(Boolean(fieldErrors.role))}
                >
                  <option value="GURU">Guru (Pendidik / Pembuat Ujian)</option>
                  <option value="SISWA">Siswa (Peserta Ujian CBT)</option>
                </select>
                {fieldErrors.role && <FieldError id="role-error" message={fieldErrors.role} />}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSaving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function roleLabel(role: Role): string {
  if (role === 'ADMIN') return 'Admin'
  return role === 'GURU' ? 'Guru' : 'Siswa'
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${
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
