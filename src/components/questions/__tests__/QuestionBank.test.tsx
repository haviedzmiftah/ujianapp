import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QuestionBank from '../QuestionBank'
import type { QuestionRecord } from '@/types'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const question: QuestionRecord = {
  id: 'question-1',
  guruId: 'guru-1',
  text: 'Berapa hasil 2 + 2?',
  optionA: '3',
  optionB: '4',
  optionC: '5',
  optionD: '6',
  correctOption: 'B',
  version: 1,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderBank(initialQuestions: QuestionRecord[] = []) {
  return render(
    <QuestionBank
      initialQuestions={initialQuestions}
      currentPage={1}
      totalQuestions={initialQuestions.length}
      pageSize={20}
    />
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('QuestionBank', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    refresh.mockReset()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('creates a question and displays the saved confirmation', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: question }, 201))
    renderBank()

    fireEvent.change(screen.getByLabelText('Pertanyaan'), {
      target: { value: question.text },
    })
    for (const option of ['A', 'B', 'C', 'D'] as const) {
      fireEvent.change(screen.getByLabelText(`Opsi ${option}`), {
        target: { value: question[`option${option}`] },
      })
    }
    fireEvent.change(screen.getByLabelText('Kunci Jawaban'), {
      target: { value: question.correctOption },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Soal' }))

    expect((await screen.findByRole('status')).textContent).toContain('Soal berhasil disimpan.')
    expect(screen.getByText(question.text)).toBeTruthy()
    expect(fetch).toHaveBeenCalledWith(
      '/api/questions',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows field validation messages returned by the API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: 'Validasi soal gagal.', details: { text: 'Pertanyaan wajib diisi.' } }, 400)
    )
    renderBank()
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Soal' }))

    expect(await screen.findByText('Pertanyaan wajib diisi.')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('Validasi soal gagal.')
  })

  it('loads a question for editing and updates it', async () => {
    const updatedQuestion = { ...question, text: 'Soal diperbarui?' }
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: updatedQuestion }))
    renderBank([question])
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Pertanyaan'), {
      target: { value: updatedQuestion.text },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

    expect((await screen.findByRole('status')).textContent).toContain('Soal berhasil diperbarui.')
    expect(screen.getByText(updatedQuestion.text)).toBeTruthy()
    expect(fetch).toHaveBeenCalledWith(
      `/api/questions/${question.id}`,
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('confirms deletion before removing a question', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ data: { message: 'Soal berhasil dihapus.' } })
    )
    renderBank([question])
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `/api/questions/${question.id}`,
      { method: 'DELETE' }
    ))
    expect(window.confirm).toHaveBeenCalled()
    expect(screen.queryByText(question.text)).toBeNull()
    expect(screen.getByRole('status').textContent).toContain('Soal berhasil dihapus.')
  })

  it('keeps the question and displays the API error when deletion is rejected', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: 'Soal tidak dapat dihapus karena terkait dengan data ujian.' }, 422)
    )
    renderBank([question])
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Soal tidak dapat dihapus karena terkait dengan data ujian.'
    )
    expect(screen.getByText(question.text)).toBeTruthy()
  })
})
