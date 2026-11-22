'use client'

interface ViolationWarningModalProps {
  open: boolean
  violationCount: number
  onConfirm: () => void
}

export function ViolationWarningModal({
  open,
  violationCount,
  onConfirm,
}: ViolationWarningModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="violation-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="violation-title" className="text-lg font-semibold text-red-700">
          Peringatan pelanggaran
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          Aktivitas mencurigakan terdeteksi. Jumlah pelanggaran saat ini: {violationCount}.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-lg bg-red-700 px-4 py-2 font-semibold text-white"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  )
}
