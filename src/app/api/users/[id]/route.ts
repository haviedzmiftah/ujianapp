import { NextResponse } from 'next/server'
import { updateUserSchema, formatZodIssues } from '@/lib/users/user.validator'
import { updateUser, UserConflictError, UserNotFoundError } from '@/lib/users/user.service'
import { isAuthError, requireRole } from '@/lib/auth/guards'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole('ADMIN')
    if (isAuthError(auth)) return auth

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodIssues(parsed),
        },
        { status: 400 }
      )
    }

    const user = await updateUser(id, parsed.data)
    return NextResponse.json({ data: user })
  } catch (error) {
    if (error instanceof UserConflictError) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 409 })
    }

    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Gagal memperbarui user' }, { status: 500 })
  }
}
