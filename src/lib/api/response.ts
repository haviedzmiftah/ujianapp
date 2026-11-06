/**
 * Helper untuk respons API yang konsisten di semua route handlers.
 * Mengikuti pola: { data } untuk sukses, { error, details? } untuk gagal.
 */

export function successResponse<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status })
}

export function errorResponse(
  message: string,
  status: number,
  details?: Record<string, string>
): Response {
  const body = details ? { error: message, details } : { error: message }
  return Response.json(body, { status })
}
