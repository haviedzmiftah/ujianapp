import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { questionSchema } from '../question'

const validQuestion = {
  text: 'Question',
  optionA: 'Option A',
  optionB: 'Option B',
  optionC: 'Option C',
  optionD: 'Option D',
  correctOption: 'A',
}

describe('questionSchema', () => {
  it('accepts valid question content and trims text fields', () => {
    const result = questionSchema.parse({
      ...validQuestion,
      text: '  Question  ',
      optionA: '  Option A  ',
    })

    expect(result.text).toBe('Question')
    expect(result.optionA).toBe('Option A')
  })

  it('rejects empty or whitespace-only text and options', () => {
    for (const field of ['text', 'optionA', 'optionB', 'optionC', 'optionD'] as const) {
      expect(questionSchema.safeParse({ ...validQuestion, [field]: ' \t\n\r ' }).success).toBe(false)
      expect(questionSchema.safeParse({ ...validQuestion, [field]: '' }).success).toBe(false)
    }
  })

  it('rejects all whitespace-only inputs for every text field', () => {
    // Feature: ujian-app, Property 7: whitespace-only input rejection
    const whitespaceOnly = fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 100 })
      .map((characters) => characters.join(''))

    fc.assert(
      fc.property(whitespaceOnly, (input) => {
        for (const field of ['text', 'optionA', 'optionB', 'optionC', 'optionD'] as const) {
          expect(questionSchema.safeParse({ ...validQuestion, [field]: input }).success).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('enforces question and option length limits', () => {
    expect(questionSchema.safeParse({ ...validQuestion, text: 'q'.repeat(1000) }).success).toBe(true)
    expect(questionSchema.safeParse({ ...validQuestion, text: 'q'.repeat(1001) }).success).toBe(false)
    expect(questionSchema.safeParse({ ...validQuestion, optionA: 'a'.repeat(500) }).success).toBe(true)
    expect(questionSchema.safeParse({ ...validQuestion, optionA: 'a'.repeat(501) }).success).toBe(false)
  })

  it('accepts only A, B, C, or D as the correct option', () => {
    for (const correctOption of ['A', 'B', 'C', 'D']) {
      expect(questionSchema.safeParse({ ...validQuestion, correctOption }).success).toBe(true)
    }
    expect(questionSchema.safeParse({ ...validQuestion, correctOption: 'E' }).success).toBe(false)
  })
})
