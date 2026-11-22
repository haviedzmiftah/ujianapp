'use client'

import type { ExamQuestionPayload, QuestionOption } from '@/types'

interface QuestionDisplayProps {
  question: ExamQuestionPayload
  optionOrder: readonly QuestionOption[]
  displayNumber: number
  selectedOption: QuestionOption | undefined
  onSelect: (option: QuestionOption) => void
}

const optionTextKeys: Record<QuestionOption, 'optionA' | 'optionB' | 'optionC' | 'optionD'> = {
  A: 'optionA',
  B: 'optionB',
  C: 'optionC',
  D: 'optionD',
}

export function QuestionDisplay({
  question,
  optionOrder,
  displayNumber,
  selectedOption,
  onSelect,
}: QuestionDisplayProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-500">Soal nomor {displayNumber}</h2>
      <p className="mb-6 whitespace-pre-wrap text-lg text-gray-900">{question.snapshot.text}</p>
      <div className="space-y-3">
        {optionOrder.map((option, index) => {
          const textKey = optionTextKeys[option]
          const isSelected = selectedOption === option
          return (
            <button
              key={`${question.id}-${option}`}
              type="button"
              onClick={() => onSelect(option)}
              className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="font-semibold text-gray-700">{index + 1}.</span>
              <span>{question.snapshot[textKey]}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
