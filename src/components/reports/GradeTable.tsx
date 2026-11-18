import type { ReportEntry } from '@/lib/scoring'

export default function GradeTable({ students }: { students: ReportEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3">Siswa</th>
            <th className="px-4 py-3">Nilai Akhir</th>
            <th className="px-4 py-3">Violation</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={`${student.studentName}-${index}`} className="border-t">
              <td className="px-4 py-3">{student.studentName}</td>
              <td className="px-4 py-3">{student.finalScore.toFixed(2)}</td>
              <td className="px-4 py-3">{student.violations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
