import type { QuestionAnalysis } from '@/lib/reports/report.service'

export default function QuestionAnalysisTable({
  questionAnalysis,
}: {
  questionAnalysis: QuestionAnalysis[]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Soal</th>
            <th className="px-4 py-3">Jawaban Benar</th>
            <th className="px-4 py-3">A</th>
            <th className="px-4 py-3">B</th>
            <th className="px-4 py-3">C</th>
            <th className="px-4 py-3">D</th>
          </tr>
        </thead>
        <tbody>
          {questionAnalysis.map((question) => (
            <tr key={question.examQuestionId} className="border-t">
              <td className="max-w-xl px-4 py-3">{question.text}</td>
              <td className="px-4 py-3">{question.correctRate.toFixed(2)}%</td>
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <td key={option} className="px-4 py-3">
                  {question.optionCounts[option]}<span className="sr-only">: {question.options[option]}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
