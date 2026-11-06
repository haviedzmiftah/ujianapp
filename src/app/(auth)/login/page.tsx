'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth.actions'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(loginAction, undefined)

  const isLocked = state?.error === 'ACCOUNT_LOCKED'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Masuk</h1>
        <p className="text-sm text-gray-500 mb-8">Ujian App — Sistem Ujian Online</p>

        {/* Notifikasi akun terkunci */}
        {isLocked && state.lockedUntil && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800">Akun Anda terkunci</p>
            <p className="text-sm text-amber-700 mt-1">
              Terlalu banyak percobaan login gagal. Akun akan terbuka kembali pada{' '}
              <span className="font-medium">
                {new Date(state.lockedUntil).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              .
            </p>
          </div>
        )}

        {/* Error generik */}
        {state?.error && !isLocked && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">Email atau password salah.</p>
          </div>
        )}

        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent disabled:opacity-50"
              placeholder="nama@institusi.ac.id"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-transparent disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isLocked}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                       focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {isPending ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
