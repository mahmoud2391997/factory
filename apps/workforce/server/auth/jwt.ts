import { SignJWT, jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_NAME = 'wf_auth'

function secretKey() {
  const secret = process.env.WORKFORCE_JWT_SECRET?.trim()
  if (!secret) throw new Error('WORKFORCE_JWT_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  sub: string
  email: string
}

export async function issueAccessToken(payload: SessionPayload) {
  const key = secretKey()
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
  try {
    const key = secretKey()
    const verified = await jwtVerify(token, key, { algorithms: ['HS256'] })
    const sub = String(verified.payload.sub ?? '')
    if (!sub) return null
    return { sub, email: String(verified.payload.email ?? '') }
  } catch {
    return null
  }
}

export function getAccessTokenFromRequest(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value ?? null
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

