import { z } from 'zod'

export const roleSchema = z.enum(['ADMIN', 'GURU', 'SISWA'])

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: roleSchema,
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter').optional(),
  email: z.string().trim().email('Format email tidak valid').optional(),
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  role: roleSchema.optional(),
})

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ message: 'Status aktif wajib diisi' }),
})

export function formatZodIssues<T>(result: z.ZodSafeParseError<T>): Record<string, string> {
  return result.error.issues.reduce<Record<string, string>>((details, issue) => {
    const field = issue.path[0]?.toString() ?? 'field'
    details[field] = issue.message
    return details
  }, {})
}
