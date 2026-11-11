'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { QuestionInput } from '@/lib/validators/question'
import type { QuestionRecord } from '@/types'

type QuestionContent = Omit<
  QuestionRecord,
  'id' | 'guruId' | 'version' | 'isDeleted' | 'createdAt' | 'updatedAt'
>

interface QuestionBankProps {
  initialQuestions: QuestionRecord[]
  currentPage: number
  totalQuestions: number
  pageSize: number
}

interface ApiResult {
  data?: QuestionRecord | { message: string }
  error?: string
  details?: Record<string, string>
}

const EMPTY_QUESTION: QuestionInput = {
  text: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
}

const QUESTION_FIELDS = [
  { name: 'text', label: 'Pertanyaan', maxLength: 1000 },
  { name: 'optionA', label: 'Opsi A', maxLength: 500 },
  { name: 'optionB', label: 'Opsi B', maxLength: 500 },
  { name: 'optionC', label: 'Opsi C', maxLength: 500 },
  { name: 'optionD', label: 'Opsi D', maxLength: 500 },
] as const

export default function QuestionBank({
  initialQuestions,
  currentPage,
  totalQuestions,
  pageSize,
}: QuestionBankProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initialQuestions)
  const [total, setTotal] = useState(totalQuestions)
  const [form, setForm] = useState<QuestionInput>(EMPTY_QUESTION)
  const [editingQuestion, setEditingQuestion] = useState<QuestionRecord | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setQuestions(initialQuestions)
    setTotal(totalQuestions)
  }, [initialQuestions, totalQuestions])

  function startEditing(question: QuestionRecord) {
    setEditingQuestion(question)
    setForm(questionContent(question))
    clearMessages()
  }

  function resetForm() {
    setEditingQuestion(null)
    setForm(EMPTY_QUESTION)
    clearMessages()
  }

  function clearMessages() {
    setFieldErrors({})
    setFormError('')
    setNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    clearMessages()
    try {
      await saveQuestion()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan soal.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveQuestion() {
    const response = await fetch(
      editingQuestion ? `/api/questions/${editingQuestion.id}` : '/api/questions',
      {
        method: editingQuestion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }
    )
    const result = (await response.json()) as ApiResult
    if (!response.ok) {
      setFieldErrors(result.details ?? {})
      setFormError(result.error ?? 'Gagal menyimpan soal.')
      return
    }
    if (!isQuestionRecord(result.data)) throw new Error('Respons server tidak memuat data soal.')
    const savedQuestion = result.data

    if (editingQuestion) {
      setQuestions((current) =>
        current.map((question) =>
          question.id === savedQuestion.id ? savedQuestion : question
        )
      )
      setNotice('Soal berhasil diperbarui.')
    } else {
      setTotal((current) => current + 1)
      setNotice('Soal berhasil disimpan.')
      if (currentPage === 1) {
        setQuestions((current) => [savedQuestion, ...current].slice(0, pageSize))
      } else {
        router.refresh()
      }
    }
    setEditingQuestion(null)
    setForm(EMPTY_QUESTION)
  }

  async function handleDelete(question: QuestionRecord) {
    if (!window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) return

    setPendingDeleteId(question.id)
    clearMessages()
    try {
      const response = await fetch(`/api/questions/${question.id}`, { method: 'DELETE' })
      const result = (await response.json()) as ApiResult
      if (!response.ok) {
        setFormError(result.error ?? 'Gagal menghapus soal.')
        return
      }
      setQuestions((current) => current.filter((entry) => entry.id !== question.id))
      setTotal((current) => Math.max(0, current - 1))
      if (questions.length === 1 && currentPage > 1) router.refresh()
      if (editingQuestion?.id === question.id) resetForm()
      setNotice('Soal berhasil dihapus.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Gagal menghapus soal.')
    } finally {
      setPendingDeleteId(null)
    }
  }

  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daftar Soal</h2>
            <p className="mt-1 text-sm text-gray-500">{total} soal</p>
          </div>
          <span className="text-sm text-gray-500">
            Halaman {currentPage} dari {lastPage}
          </span>
        </div>

        {formError && <Feedback kind="error">{formError}</Feedback>}
        {notice && <Feedback kind="success">{notice}</Feedback>}

        <div className="space-y-4">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    Soal {(currentPage - 1) * pageSize + index + 1}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                    {question.text}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(question)}
                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pendingDeleteId === question.id}
                    onClick={() => void handleDelete(question)}
                    className="text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    {pendingDeleteId === question.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
              <ol className="mt-3 space-y-1.5 text-sm text-gray-700">
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <li key={option} className="flex gap-2">
                    <span className="font-medium">{option}.</span>
                    <span className="whitespace-pre-wrap">{question[`option${option}`]}</span>
                    {question.correctOption === option && (
                      <span className="text-xs font-medium text-green-700">(Kunci jawaban)</span>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          ))}
          {questions.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              Belum ada soal. Gunakan formulir untuk menambahkan soal pertama.
            </p>
          )}
        </div>

        <nav aria-label="Navigasi halaman bank soal" className="mt-5 flex justify-between">
          {currentPage > 1 ? (
            <Link
              href={`/guru/dashboard/bank-soal?page=${currentPage - 1}`}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Sebelumnya
            </Link>
          ) : <span />}
          {currentPage < lastPage && (
            <Link
              href={`/guru/dashboard/bank-soal?page=${currentPage + 1}`}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Berikutnya
            </Link>
          )}
        </nav>
      </section>

      <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {editingQuestion ? 'Edit Soal' : 'Buat Soal'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Isi pertanyaan, empat opsi jawaban, dan pilih kunci jawaban.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {QUESTION_FIELDS.map(({ name, label, maxLength }) => (
            <QuestionField
              key={name}
              name={name}
              label={label}
              value={form[name]}
              maxLength={maxLength}
              error={fieldErrors[name]}
              onChange={(value) => setForm((current) => ({ ...current, [name]: value }))}
            />
          ))}
          <div>
            <label htmlFor="correctOption" className="mb-1.5 block text-sm font-medium text-gray-700">
              Kunci Jawaban
            </label>
            <select
              id="correctOption"
              value={form.correctOption}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  correctOption: parseOption(event.target.value),
                }))
              }
              aria-invalid={Boolean(fieldErrors.correctOption)}
              className={inputClass(Boolean(fieldErrors.correctOption))}
            >
              <option value="A">Opsi A</option>
              <option value="B">Opsi B</option>
              <option value="C">Opsi C</option>
              <option value="D">Opsi D</option>
            </select>
            {fieldErrors.correctOption && (
              <FieldError message={fieldErrors.correctOption} />
            )}
          </div>
          {fieldErrors._form && <FieldError message={fieldErrors._form} />}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan' : 'Simpan Soal'}
            </button>
            {editingQuestion && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}

function questionContent(question: QuestionRecord): QuestionInput {
  return {
    text: question.text,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctOption,
  }
}

function isQuestionRecord(value: ApiResult['data']): value is QuestionRecord {
  return typeof value === 'object' && value !== null && 'id' in value
}

function parseOption(value: string): QuestionInput['correctOption'] {
  if (value === 'B' || value === 'C' || value === 'D') return value
  return 'A'
}

function inputClass(hasError: boolean): string {
  return `w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-400' : 'border-gray-300'
  }`
}

function QuestionField({
  name,
  label,
  value,
  maxLength,
  error,
  onChange,
}: {
  name: keyof QuestionContent
  label: string
  value: string
  maxLength: number
  error?: string
  onChange: (value: string) => void
}) {
  const errorId = `${name}-error`
  const isQuestion = name === 'text'

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {isQuestion ? (
        <textarea
          id={name}
          rows={4}
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={inputClass(Boolean(error))}
        />
      ) : (
        <input
          id={name}
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={inputClass(Boolean(error))}
        />
      )}
      <p className="mt-1 text-right text-xs text-gray-500">
        {value.length}/{maxLength}
      </p>
      {error && <FieldError id={errorId} message={error} />}
    </div>
  )
}

function FieldError({ id, message }: { id?: string; message: string }) {
  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  )
}

function Feedback({
  kind,
  children,
}: {
  kind: 'error' | 'success'
  children: string
}) {
  const isError = kind === 'error'
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`mb-4 rounded-lg border p-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-green-200 bg-green-50 text-green-700'
      }`}
    >
      {children}
    </p>
  )
}
