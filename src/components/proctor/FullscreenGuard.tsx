'use client'

import { useEffect, useState, type ReactNode } from 'react'

interface FullscreenGuardProps {
  enabled: boolean
  children: ReactNode
}

export function FullscreenGuard({ enabled, children }: FullscreenGuardProps) {
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsFullscreenActive(true)
      return
    }
    setIsFullscreenActive(document.fullscreenElement !== null)
    const handleFullscreenChange = () => {
      setIsFullscreenActive(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [enabled])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreenActive(true)
    } catch {
      setIsFullscreenActive(false)
    }
  }

  if (enabled && !isFullscreenActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Mode fullscreen diperlukan</h1>
          <p className="mt-2 text-sm text-gray-600">
            Aktifkan fullscreen sebelum memulai pengerjaan ujian.
          </p>
          <button
            type="button"
            onClick={() => void enterFullscreen()}
            className="mt-5 rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white"
          >
            Mulai Ujian
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
