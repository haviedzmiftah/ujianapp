'use client'

interface CountdownTimerProps {
  remainingSeconds: number
}

export function CountdownTimer({ remainingSeconds }: CountdownTimerProps) {
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60
  const display = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
  const isUrgent = remainingSeconds <= 300

  return (
    <div
      className={`rounded-lg border px-4 py-2 font-mono text-lg font-semibold ${
        isUrgent
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-gray-200 bg-white text-gray-900'
      }`}
      aria-label={`Sisa waktu ${display}`}
    >
      {display}
    </div>
  )
}
