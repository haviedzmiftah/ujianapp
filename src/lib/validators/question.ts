import { z } from 'zod'

const questionTextSchema = z.string().trim().min(1).max(1000)
const answerOptionSchema = z.string().trim().min(1).max(500)

export const questionSchema = z.object({
  text: questionTextSchema,
  optionA: answerOptionSchema,
  optionB: answerOptionSchema,
  optionC: answerOptionSchema,
  optionD: answerOptionSchema,
  correctOption: z.enum(['A', 'B', 'C', 'D']),
})

export const updateQuestionSchema = questionSchema.partial()

export type QuestionInput = z.infer<typeof questionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
