'use client'

import { useEffect, useState } from 'react'
import type { ClassRecord, UserRecord } from '@/types'

interface ClassDetailModalProps {
  cls: ClassRecord
  onClose: () => void
  onStudentUpdated: () => void
}

interface ApiResult<T> {
  data?: T
  error?: string
}

export function ClassDetailModal({ cls, onClose, onStudentUpdated }: ClassDetailModalProps) {
  const [students, setStudents] = useState<UserRecord[]>([])
  const [availableStudents, setAvailableStudents] = useState<UserRecord[]>([])
  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    void fetchStudents()
  }, [cls.id])

  async function fetchStudents() {
    setIsLoading(true)
    setError('')
    try {
      const [classRes, allUsersRes] = await Promise.all([
        fetch(`/api/classes/${cls.id}/students`),
        fetch(`/api/users?role=SISWA&limit=100`),
      ])

      const classData = (await classRes.json()) as ApiResult<UserRecord[]>
      const allUsersData = (await allUsersRes.json()) as ApiResult<{ items: UserRecord[] }>

      if (!classRes.ok) throw new Error(classData.error ?? 'Gagal memuat siswa kelas')
      if (!allUsersRes.ok) throw new Error(allUsersData.error ?? 'Gagal memuat data pengguna')

      const currentStudents = classData.data ?? []
      setStudents(currentStudents)

      // Siswa yang belum masuk ke kelas ini
      const currentIds = new Set(currentStudents.map((s) => s.id))
      const available = (allUsersData.data?.items ?? []).filter((u) => !currentIds.has(u.id))
      setAvailableStudents(available)
      if (available.length > 0) {
        setSelectedSiswaId(available[0].id)
      } else {
        setSelectedSiswaId('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddStudent() {
    if (!selectedSiswaId) return
    setIsSubmitting(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch(`/api/classes/${cls.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswaId: selectedSiswaId }),
      })
      const result = (await res.json()) as ApiResult<{ message: string }>
      if (!res.ok) throw new Error(result.error ?? 'Gagal menambahkan siswa')

      setNotice('Siswa berhasil ditambahkan ke dalam kelas.')
      onStudentUpdated()
      await fetchStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan siswa')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveStudent(siswa: UserRecord) {
    if (!window.confirm(`Keluarkan ${siswa.name} dari kelas ${cls.name}?`)) return
    setIsSubmitting(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch(`/api/classes/${cls.id}/students/${siswa.id}`, {
        method: 'DELETE',
      })
      const result = (await res.json()) as ApiResult<{ message: string }>
      if (!res.ok) throw new Error(result.error ?? 'Gagal mengeluarkan siswa')

      setNotice(`Siswa ${siswa.name} telah dikeluarkan dari kelas.`)
      onStudentUpdated()
      await fetchStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengeluarkan siswa')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Daftar Siswa — {cls.name}</h3>
              <p className="text-xs text-slate-500">
                {cls.grade ? `Tingkat ${cls.grade} • ` : ''}Kelola anggota dan penempatan siswa di kelas ini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notifikasi */}
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notice}</span>
          </div>
        )}

        {/* Tambah Siswa ke Kelas Bar */}
        <div className="mb-5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Pilih Siswa untuk Ditambahkan ke Kelas Ini
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <select
              value={selectedSiswaId}
              onChange={(e) => setSelectedSiswaId(e.target.value)}
              disabled={availableStudents.length === 0 || isSubmitting}
              className="flex-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
            >
              {availableStudents.length === 0 ? (
                <option value="">Tidak ada siswa lain yang tersedia</option>
              ) : (
                availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email}) {s.classId ? '— [Sudah di kelas lain]' : ''}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() => void handleAddStudent()}
              disabled={!selectedSiswaId || isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{isSubmitting ? 'Memproses...' : 'Tambahkan'}</span>
            </button>
          </div>
        </div>

        {/* Tabel Siswa di Kelas */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
          {isLoading ? (
            <p className="p-8 text-center text-xs text-slate-400">Memuat data siswa kelas...</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Nama Siswa</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 text-xs">{student.name}</p>
                      <p className="text-[11px] text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${student.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${student.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {student.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleRemoveStudent(student)}
                        disabled={isSubmitting}
                        className="rounded-md border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Keluarkan
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">
                      Belum ada siswa yang dimasukkan ke kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
