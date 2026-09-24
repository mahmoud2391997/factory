import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  key: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const expected = process.env.WORKFORCE_API_KEY?.trim()
  if (!expected) {
    return NextResponse.json({ success: false, message: 'WORKFORCE_API_KEY غير مضبوط' }, { status: 500 })
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'بيانات غير صحيحة' }, { status: 400 })
  }

  if (parsed.data.key !== expected) {
    return NextResponse.json({ success: false, message: 'مفتاح غير صحيح' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('workforce_key', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return res
}

