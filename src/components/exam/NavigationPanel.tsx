'use client'

export type AnswerStatus = 'answered' | 'unanswered' | 'error'

interface NavigationPanelProps {
  statuses: AnswerStatus[]
  currentIndex: number
  onNavigate: (index: number) => void
}

export function NavigationPanel({
  statuses,
  currentIndex,
  onNavigate,
}: NavigationPanelProps) {
  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-gray-900">Navigasi Soal</h2>
      <div className="grid grid-cols-5 gap-2">
        {statuses.map((status, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`Soal ${index + 1}: ${status}`}
            className={`h-10 rounded-lg text-sm font-semibold ${
              index === currentIndex
                ? 'ring-2 ring-blue-600 ring-offset-1'
                : ''
            } ${
              status === 'answered'
                ? 'bg-green-600 text-white'
                : status === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-1 text-xs text-gray-600">
        <p>Hijau: dijawab</p>
        <p>Abu-abu: belum dijawab</p>
        <p>Merah: error sinkronisasi</p>
      </div>
    </aside>
  )
}
