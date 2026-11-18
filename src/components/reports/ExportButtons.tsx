'use client'

import { useState } from 'react'
import type { ExamReport } from '@/lib/reports/report.service'

export default function ExportButtons({ report }: { report: ExamReport }) {
  const [error, setError] = useState('')

  async function handlePdf() {
    setError('')
    try {
      const { exportExamReportPdf } = await import('@/lib/export/pdf')
      await exportExamReportPdf(report)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Ekspor PDF gagal.')
    }
  }

  async function handleExcel() {
    setError('')
    try {
      const { exportExamReportExcel } = await import('@/lib/export/excel')
      await exportExamReportExcel(report)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Ekspor Excel gagal.')
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button type="button" onClick={handlePdf} className="rounded bg-red-600 px-4 py-2 text-sm text-white">
          Ekspor PDF
        </button>
        <button type="button" onClick={handleExcel} className="rounded bg-green-600 px-4 py-2 text-sm text-white">
          Ekspor Excel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
