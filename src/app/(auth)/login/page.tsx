import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Masuk</h1>
        <p className="text-sm text-gray-500 mb-8">Ujian App — Sistem Ujian Online</p>
        <LoginForm />
      </div>
    </div>
  )
}
