'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { ClassRecord } from '@/types'
import { ClassDetailModal } from './ClassDetailModal'

interface ClassManagementProps {
  initialClasses: ClassRecord[]
}

interface ClassFormValues {
  name: string
  grade: string
  description: string
}

interface ApiResult<T> {
  data?: T
  error?: string
  details?: Record<string, string>
}

const EMPTY_FORM: ClassFormValues = {
  name: '',
  grade: '',
  description: '',
}

export function ClassManagement({ initialClasses }: ClassManagementProps) {
  const [classes, setClasses] = useState<ClassRecord[]>(initialClasses)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null)
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<ClassRecord | null>(null)

  const [form, setForm] = useState<ClassFormValues>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('ALL')

  useEffect(() => {
    setClasses(initialClasses)
  }, [initialClasses])

  async function refetchClasses() {
    try {
      const res = await fetch('/api/classes')
      const result = (await res.json()) as ApiResult<ClassRecord[]>
      if (res.ok && result.data) {
        setClasses(result.data)
      }
    } catch {
      // ignore
    }
  }

  function openCreateModal() {
    setEditingClass(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  function startEditing(cls: ClassRecord) {
    setEditingClass(cls)
    setForm({
      name: cls.name,
      grade: cls.grade ?? '',
      description: cls.description ?? '',
    })
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingClass(null)
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
      const payload = {
        name: form.name,
        grade: form.grade || null,
        description: form.description || null,
      }

      const response = await fetch(
        editingClass ? `/api/classes/${editingClass.id}` : '/api/classes',
        {
          method: editingClass ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const result = (await response.json()) as ApiResult<ClassRecord>
      if (!response.ok) {
        setFieldErrors(result.details ?? {})
        setFormError(result.error ?? 'Gagal menyimpan kelas.')
        return
      }

      const saved = result.data
      if (!saved) throw new Error('Data kelas tidak ditemukan dalam respon.')

      if (editingClass) {
        setClasses((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
        setNotice(`Kelas "${saved.name}" berhasil diperbarui.`)
      } else {
        setClasses((prev) => [saved, ...prev])
        setNotice(`Kelas baru "${saved.name}" berhasil dibuat.`)
      }

      closeModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(cls: ClassRecord) {
    if ((cls._count?.students ?? 0) > 0) {
      alert(`Kelas "${cls.name}" masih memiliki ${cls._count?.students} siswa terdaftar. Keluarkan semua siswa sebelum menghapus kelas ini.`)
      return
    }

    if (!window.confirm(`Hapus kelas "${cls.name}" secara permanen?`)) return

    setIsDeletingId(cls.id)
    setFormError('')
    setNotice('')

    try {
      const res = await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' })
      const result = (await res.json()) as ApiResult<{ message: string }>
      if (!res.ok) throw new Error(result.error ?? 'Gagal menghapus kelas')

      setClasses((prev) => prev.filter((c) => c.id !== cls.id))
      setNotice(`Kelas "${cls.name}" berhasil dihapus.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus kelas')
    } finally {
      setIsDeletingId(null)
    }
  }

  // Filtered classes
  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesGrade = gradeFilter === 'ALL' || c.grade === gradeFilter
    return matchesSearch && matchesGrade
  })

  // Ekstrak daftar tingkat/grade unik
  const uniqueGrades = Array.from(
    new Set(classes.map((c) => c.grade).filter((g): g is string => Boolean(g)))
  ).sort()

  return (
    <div className="space-y-6">
      {/* Alert Notice */}
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
        {/* Toolbar Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Rombongan Belajar (Kelas)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kelas, tingkat jenjang, dan distribusi penempatan siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tingkat */}
            {uniqueGrades.length > 0 && (
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="ALL">Semua Tingkat</option>
                {uniqueGrades.map((g) => (
                  <option key={g} value={g}>
                    Tingkat {g}
                  </option>
                ))}
              </select>
            )}

            {/* Pencarian */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tombol Tambah Kelas */}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Kelas</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Kelas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Nama Kelas</th>
                <th scope="col" className="px-6 py-3.5">Tingkat</th>
                <th scope="col" className="px-6 py-3.5">Keterangan</th>
                <th scope="col" className="px-6 py-3.5">Jumlah Siswa</th>
                <th scope="col" className="px-6 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {cls.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{cls.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cls.grade ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Kelas {cls.grade}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {cls.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {cls._count?.students ?? 0} Siswa
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedClassForStudents(cls)}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        <span>Kelola Siswa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditing(cls)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingId === cls.id}
                        onClick={() => void handleDelete(cls)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>{isDeletingId === cls.id ? '...' : 'Hapus'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm font-semibold text-slate-700">Tidak ada data kelas ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tambah Kelas" untuk mendaftarkan kelas pertama.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Dialog Form Tambah / Edit Kelas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={closeModal} />

          {/* Modal Card */}
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingClass ? 'Edit Rombongan Belajar' : 'Tambah Kelas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingClass ? 'Perbarui informasi rombongan belajar' : 'Buat rombongan belajar baru untuk siswa'}
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

            {formError && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="class-name" className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  id="class-name"
                  type="text"
                  placeholder="misal: X IPA 1, XII RPL 2"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${
                    fieldErrors.name ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="class-grade" className="mb-1 block text-xs font-semibold text-slate-700">
                  Tingkat / Jenjang (Opsional)
                </label>
                <input
                  id="class-grade"
                  type="text"
                  placeholder="misal: 10, 11, atau 12"
                  value={form.grade}
                  onChange={(e) => setForm((prev) => ({ ...prev, grade: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>

              <div>
                <label htmlFor="class-desc" className="mb-1 block text-xs font-semibold text-slate-700">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  id="class-desc"
                  rows={2}
                  placeholder="misal: Tahun Ajaran 2026/2027"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                />
              </div>

              {/* Actions */}
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
                  {isSaving ? 'Menyimpan...' : editingClass ? 'Simpan Perubahan' : 'Buat Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Siswa Per Kelas */}
      {selectedClassForStudents && (
        <ClassDetailModal
          cls={selectedClassForStudents}
          onClose={() => setSelectedClassForStudents(null)}
          onStudentUpdated={() => void refetchClasses()}
        />
      )}
    </div>
  )
}
