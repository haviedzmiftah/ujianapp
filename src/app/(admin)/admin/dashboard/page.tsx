import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listUsers } from '@/lib/users/user.service'

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Memuat dashboard...</p>}>
      <AdminDashboardContent />
    </Suspense>
  )
}

async function AdminDashboardContent() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  // Ambil ringkasan user secara bersih via user.service
  const [allUsers, guruUsers, siswaUsers] = await Promise.all([
    listUsers({ limit: 100 }),
    listUsers({ role: 'GURU', limit: 100 }),
    listUsers({ role: 'SISWA', limit: 100 }),
  ])

  const totalUsers = allUsers.total
  const totalGuru = guruUsers.total
  const totalSiswa = siswaUsers.total
  const totalAktif = allUsers.items.filter((u) => u.isActive).length

  return (
    <div className="space-y-6">
      {/* Header Banner Dash UI style */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang, {session.name}! 👋
          </h1>
          <p className="mt-1 text-sm sm:text-base text-indigo-200">
            Berikut ringkasan operasional dan metrik pengguna sistem ujian Anda hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/users"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Kelola Pengguna</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards Dash UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Pengguna */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Pengguna
            </span>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{totalUsers}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center font-medium text-emerald-600">
                Terdaftar di sistem
              </span>
            </div>
          </div>
        </div>

        {/* Total Guru */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Akun Guru
            </span>
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{totalGuru}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-500 font-medium">Pembuat Soal & Ujian</span>
            </div>
          </div>
        </div>

        {/* Total Siswa */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Akun Siswa
            </span>
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{totalSiswa}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-500 font-medium">Peserta Ujian CBT</span>
            </div>
          </div>
        </div>

        {/* Akun Aktif */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status Aktif
            </span>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{totalAktif}</h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Akun aktif dan siap akses
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Pengguna Terbaru (Dash UI styled card) */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">
              Daftar Pengguna Terbaru
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              Akun yang terakhir dibuat dalam sistem
            </p>
          </div>
          <Link
            href="/admin/dashboard/users"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">Nama & Email</th>
                <th scope="col" className="px-6 py-3.5">Peran</th>
                <th scope="col" className="px-6 py-3.5">Status</th>
                <th scope="col" className="px-6 py-3.5">Dibuat Pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allUsers.items.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-xs text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 ring-purple-700/10'
                          : user.role === 'GURU'
                          ? 'bg-sky-50 text-sky-700 ring-sky-700/10'
                          : 'bg-blue-50 text-blue-700 ring-blue-700/10'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
              {allUsers.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                    Belum ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
