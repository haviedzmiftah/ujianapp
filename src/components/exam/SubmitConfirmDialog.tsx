'use client'

interface SubmitConfirmDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function SubmitConfirmDialog({
  open,
  onCancel,
  onConfirm,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Selesaikan ujian?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Jawaban yang sudah tersimpan akan dikumpulkan. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Mengumpulkan...' : 'Selesaikan'}
          </button>
        </div>
      </div>
    </div>
  )
}
