import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function HomePage() {
  const session = await getSession()

  // Jika sudah login dan akun aktif, arahkan langsung ke dashboard sesuai role
  if (session && session.isActive && ROLE_HOME[session.role]) {
    redirect(ROLE_HOME[session.role])
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col lg:flex-row overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      {/* Background Ornamen Gradien Terpadu Satu Layar Penuh */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Glow lingkaran halus di beberapa titik */}
        <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-blue-600/25 blur-[128px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[36rem] w-[36rem] rounded-full bg-indigo-600/20 blur-[140px]" />
        <div className="absolute -bottom-32 right-0 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-[120px]" />
        
        {/* Pola grid titik transparan yang halus menyatu di seluruh halaman */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Kolom Kiri: Hero & Branding (70% pada layar besar) */}
      <section className="relative flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 sm:py-16 lg:w-[70%] lg:flex-none lg:min-h-screen lg:p-20">
        {/* Header / Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 border border-white/20 backdrop-blur-md shadow-inner">
            <svg className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Ujian App</span>
            <span className="block text-xs font-medium text-sky-300">Computer Based Test System</span>
          </div>
        </div>

        {/* Konten Hero Tengah */}
        <div className="my-10 max-w-2xl lg:my-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-medium text-sky-200 backdrop-blur-md mb-6 shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Ujian Online Terintegrasi & Aman
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-5xl xl:text-6xl leading-[1.15]">
            Evaluasi Belajar Digital yang{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
              Akurat & Terpercaya
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg leading-relaxed text-blue-100/80 max-w-xl">
            Solusi pelaksanaan ujian berbasis komputer untuk Admin, Guru, dan Siswa dengan pemantauan proctoring real-time, pengacakan soal, dan penilaian otomatis.
          </p>

          {/* Fitur Sorotan Ringkas */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 text-sky-300 border border-white/10 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Anti-Kecurangan</p>
                <p className="text-xs text-sky-200/70">Deteksi fokus & tab ujian</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 text-sky-300 border border-white/10 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Otomatisasi Nilai</p>
                <p className="text-xs text-sky-200/70">Kalkulasi skor instan</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 text-sky-300 border border-white/10 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Multi-Peran</p>
                <p className="text-xs text-sky-200/70">Admin, Guru, & Siswa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info hero */}
        <div className="text-xs text-sky-200/50 hidden lg:block">
          &copy; {new Date().getFullYear()} Ujian App. Seluruh hak cipta dilindungi.
        </div>
      </section>

      {/* Kolom Kanan: Form Login (30% pada layar besar) dengan Glassmorphism terpadu */}
      <section className="relative flex items-center justify-center px-6 py-12 sm:px-12 lg:w-[30%] lg:min-h-screen lg:px-8 xl:px-12 lg:border-l lg:border-white/10 backdrop-blur-lg bg-white/[0.04]">
        <div className="w-full max-w-sm">
          {/* Header Login Form */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Selamat Datang
            </h2>
            <p className="mt-2 text-sm text-blue-200/80">
              Silakan masukkan akun Anda untuk mengakses sistem ujian.
            </p>
          </div>

          {/* Form Login Card Glassmorphism */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
            <LoginForm />
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-blue-200/60 leading-relaxed">
              Mengalami kendala login? Hubungi administrator sekolah atau proktor ujian.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
