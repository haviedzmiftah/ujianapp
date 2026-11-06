import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-24">
      <div className="w-full max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Platform Ujian Online
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl">
          Ujian App
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-600">
          Aplikasi ujian untuk Admin, Guru, dan Siswa.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          Masuk
        </Link>
      </div>
    </main>
  )
}
