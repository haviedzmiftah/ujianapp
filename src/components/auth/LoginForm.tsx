'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth.actions'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, undefined)
  const isLocked = state?.error === 'ACCOUNT_LOCKED'

  return (
    <div className="w-full">
      {/* Notifikasi akun terkunci */}
      {isLocked && state?.lockedUntil && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-100 backdrop-blur-sm">
          <p className="text-sm font-semibold flex items-center gap-1.5 text-amber-200">
            <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Akun Terkunci
          </p>
          <p className="text-xs text-amber-200/90 mt-1">
            Terlalu banyak percobaan gagal. Silakan coba lagi pada{' '}
            <span className="font-semibold text-white">
              {new Date(state.lockedUntil).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>.
          </p>
        </div>
      )}

      {/* Error kredensial */}
      {state?.error && !isLocked && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-100 text-sm flex items-center gap-2 backdrop-blur-sm">
          <svg className="w-4 h-4 text-rose-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm">Email atau password salah. Silakan periksa kembali.</span>
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-blue-100/90 uppercase tracking-wider mb-1.5">
            Email Akun / Institusi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="nama@sekolah.sch.id"
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-blue-100/90 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300/60">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-blue-200/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isLocked}
          className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
        >
          {isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memproses…
            </>
          ) : (
            <>
              <span>Masuk Sekarang</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
