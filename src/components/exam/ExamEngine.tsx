'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ExamEnginePayload, QuestionOption } from '@/types'
import { useExamTimer } from '@/hooks/useExamTimer'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { CountdownTimer } from './CountdownTimer'
import {
  NavigationPanel,
  type AnswerStatus,
} from './NavigationPanel'
import { QuestionDisplay } from './QuestionDisplay'
import { SubmitConfirmDialog } from './SubmitConfirmDialog'
import { ProctorService } from '@/components/proctor/ProctorService'

interface ExamEngineProps {
  payload: ExamEnginePayload
}

export function ExamEngine({ payload }: ExamEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, QuestionOption>
  >(() =>
    Object.fromEntries(
      payload.answers.map((answer) => [
        answer.examQuestionId,
        answer.selectedOption,
      ])
    )
  )
  const [answerStatuses, setAnswerStatuses] = useState<
    Record<string, AnswerStatus>
  >(() =>
    Object.fromEntries(
      payload.answers.map((answer) => [answer.examQuestionId, 'answered'])
    )
  )
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [violationCount, setViolationCount] = useState(payload.violationCount)
  const submitStartedRef = useRef(false)

  const orderedQuestions = useMemo(() => {
    const questionMap = new Map(payload.questions.map((question) => [question.id, question]))
    const ordered = payload.sessionOrder.questionOrder
      .map((questionId) => questionMap.get(questionId))
      .filter((question) => question !== undefined)
    if (ordered.length === payload.questions.length) return ordered
    return payload.questions
  }, [payload])

  const { saveAnswer, syncPendingBeforeSubmit } = useOfflineSync(payload.session.id)

  const submitExam = useCallback(async () => {
    if (submitStartedRef.current) return
    submitStartedRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await syncPendingBeforeSubmit()
      const localAnswerCount = Object.keys(selectedAnswers).length
      const response = await fetch(
        `/api/exam-sessions/${payload.session.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localAnswerCount }),
        }
      )
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error ?? 'Gagal mengakhiri ujian.')
      }
      window.location.href = `/siswa/dashboard/ujian/${payload.exam.id}/hasil`
    } catch (error) {
      submitStartedRef.current = false
      setSubmitError(error instanceof Error ? error.message : 'Gagal mengakhiri ujian.')
    } finally {
      setIsSubmitting(false)
    }
  }, [payload.session.id, selectedAnswers, syncPendingBeforeSubmit])

  const { remainingSeconds } = useExamTimer({
    initialRemainingSeconds: payload.remainingSeconds,
    sessionId: payload.session.id,
    onTimeUp: () => {
      void submitExam()
    },
  })

  const handleSelect = async (questionId: string, option: QuestionOption) => {
    setSelectedAnswers((current) => ({ ...current, [questionId]: option }))
    setAnswerStatuses((current) => ({ ...current, [questionId]: 'unanswered' }))

    const isSaved = await saveAnswer(questionId, option)
    setAnswerStatuses((current) => ({
      ...current,
      [questionId]: isSaved ? 'answered' : 'error',
    }))
  }

  const statuses: AnswerStatus[] = orderedQuestions.map((question) => {
    if (!selectedAnswers[question.id]) return 'unanswered'
    return answerStatuses[question.id] ?? 'answered'
  })
  const currentQuestion = orderedQuestions[currentIndex]

  return (
    <ProctorService
      sessionId={payload.session.id}
      config={{
        fullscreenEnabled: payload.exam.fullscreenEnabled,
        tabSwitchDetection: payload.exam.tabSwitchDetection,
        maxViolations: payload.exam.maxViolations,
      }}
      initialViolationCount={payload.violationCount}
      onViolationCountChange={setViolationCount}
      onAutoSubmit={() => {
        void submitExam()
      }}
      onError={setSubmitError}
    >
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Ujian</p>
              <h1 className="text-2xl font-semibold text-gray-900">{payload.exam.title}</h1>
              <p className="mt-1 text-sm font-medium text-red-700">
                Pelanggaran: {violationCount}
                {payload.exam.maxViolations !== null
                  ? ` / ${payload.exam.maxViolations}`
                  : ''}
              </p>
            </div>
            <CountdownTimer remainingSeconds={remainingSeconds} />
          </header>

          {submitError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
            {currentQuestion && (
              <QuestionDisplay
                question={currentQuestion}
                optionOrder={
                  payload.sessionOrder.optionOrders[currentQuestion.id] ?? ['A', 'B', 'C', 'D']
                }
                displayNumber={currentIndex + 1}
                selectedOption={selectedAnswers[currentQuestion.id]}
                onSelect={(option) => {
                  void handleSelect(currentQuestion.id, option)
                }}
              />
            )}

            <NavigationPanel
              statuses={statuses}
              currentIndex={currentIndex}
              onNavigate={setCurrentIndex}
            />
          </div>

          <footer className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            {currentIndex < orderedQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => index + 1)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-white"
              >
                Berikutnya
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubmitDialogOpen(true)}
                className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
              >
                Selesai
              </button>
            )}
          </footer>
        </div>

        <SubmitConfirmDialog
          open={isSubmitDialogOpen}
          onCancel={() => setIsSubmitDialogOpen(false)}
          onConfirm={() => {
            void submitExam()
          }}
          isSubmitting={isSubmitting}
        />
      </div>
    </ProctorService>
  )
}
