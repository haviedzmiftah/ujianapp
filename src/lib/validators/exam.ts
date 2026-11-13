import { z } from 'zod'

export const examSchema = z.object({
  title: z.string().trim().min(1).max(200),
  durationMinutes: z.coerce.number().int().min(1).max(300),
  maxViolations: z.coerce.number().int().min(1).max(100).optional(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  fullscreenEnabled: z.boolean(),
  tabSwitchDetection: z.boolean(),
})

export const createExamSchema = examSchema.extend({
  questionIds: z.array(z.string().trim().min(1)).min(1),
})

export const updateExamSchema = examSchema.partial()

export function formatExamIssues(issues: readonly z.core.$ZodIssue[]): Record<string, string> {
  return issues.reduce<Record<string, string>>((details, issue) => {
    const field = issue.path[0]?.toString() ?? '_form'
    details[field] = issue.message
    return details
  }, {})
}

export type ExamInput = z.infer<typeof examSchema>
export type CreateExamInput = z.infer<typeof createExamSchema>
export type UpdateExamInput = z.infer<typeof updateExamSchema>
