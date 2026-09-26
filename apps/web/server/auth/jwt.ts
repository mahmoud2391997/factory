import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

import { getJwtSecretRaw } from '@/server/env'

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'

function getJwtSecret() {
  const secret = getJwtSecretRaw()
  if (!secret) throw new Error('JWT_SECRET is missing')
  return new TextEncoder().encode(secret)
}

function cookieOptions() {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true as const,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  }
}

export async function issueAccessToken(payload: { sub: string; ver?: number }) {
  const exp = process.env.ACCESS_TOKEN_TTL_SECONDS ? Number(process.env.ACCESS_TOKEN_TTL_SECONDS) : 15 * 60
  return new SignJWT({ ver: payload.ver ?? 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${exp}s`)
    .sign(getJwtSecret())
}

export async function issueRefreshToken(payload: { sub: string; ver?: number }) {
  const exp = process.env.REFRESH_TOKEN_TTL_SECONDS ? Number(process.env.REFRESH_TOKEN_TTL_SECONDS) : 30 * 24 * 60 * 60
  return new SignJWT({ ver: payload.ver ?? 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${exp}s`)
    .sign(getJwtSecret())
}

export async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload
  } catch {
    return null
  }
}

export function getAccessTokenFromRequest(req: NextRequest) {
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null
}

export function getRefreshTokenFromRequest(req: NextRequest) {
  return req.cookies.get(REFRESH_COOKIE)?.value ?? null
}

export function setAccessCookie(res: NextResponse, accessToken: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...cookieOptions(), maxAge: 15 * 60 })
}

export function setAuthCookies(res: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions(), maxAge: 15 * 60 })
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions(), maxAge: 30 * 24 * 60 * 60 })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}
