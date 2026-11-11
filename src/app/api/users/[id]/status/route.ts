import { NextResponse } from 'next/server'
import { setUserStatus, UserNotFoundError } from '@/lib/users/user.service'
import { updateUserStatusSchema, formatZodIssues } from '@/lib/users/user.validator'
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
    const parsed = updateUserStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodIssues(parsed),
        },
        { status: 400 }
      )
    }

    const user = await setUserStatus(id, parsed.data.isActive)
    return NextResponse.json({ data: user })
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Gagal memperbarui status user' }, { status: 500 })
  }
}
