import { z } from 'zod'

export const CreateClassSchema = z.object({
  name: z
    .string({
      error: 'Nama kelas wajib diisi.',
    })
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1 && val.length <= 50, {
      message: 'Nama kelas harus berisi antara 1 hingga 50 karakter.',
    }),
  grade: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
})

export const UpdateClassSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 1 && val.length <= 50, {
      message: 'Nama kelas harus berisi antara 1 hingga 50 karakter.',
    })
    .optional(),
  grade: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
  description: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .nullable(),
})

export const AssignStudentClassSchema = z.object({
  siswaId: z.string({
    error: 'ID siswa wajib disertakan.',
  }).min(1, 'ID siswa wajib disertakan.'),
})
