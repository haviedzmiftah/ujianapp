import { deleteSession } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'

export async function POST(): Promise<Response> {
  await deleteSession()
  return successResponse({ message: 'Berhasil logout' })
}
