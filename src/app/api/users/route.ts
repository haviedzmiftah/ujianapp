import { NextResponse } from 'next/server'
import { createUserSchema, formatZodIssues } from '@/lib/users/user.validator'
import { createUser, listUsers, UserConflictError } from '@/lib/users/user.service'
import { isAuthError, requireRole } from '@/lib/auth/guards'

export async function GET() {
  try {
    const auth = await requireRole('ADMIN')
    if (isAuthError(auth)) return auth

    const users = await listUsers()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil daftar user' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole('ADMIN')
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodIssues(parsed),
        },
        { status: 400 }
      )
    }

    const user = await createUser(parsed.data)
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof UserConflictError) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain.' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 })
  }
}
