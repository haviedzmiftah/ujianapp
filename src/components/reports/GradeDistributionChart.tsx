'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DistributionBucket } from '@/lib/scoring'

export default function GradeDistributionChart({
  distribution,
}: {
  distribution: DistributionBucket[]
}) {
  return (
    <div className="h-80 w-full rounded-lg border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={distribution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" name="Jumlah Siswa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
