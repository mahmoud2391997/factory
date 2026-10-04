import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

import { getJwtSecretRaw } from '@/server/env'

const ACCESS_COOKIE = 'access_token'
const REFRESH_COOKIE = 'refresh_token'
const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60
const DEFAULT_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60

function ttlSeconds(name: 'ACCESS_TOKEN_TTL_SECONDS' | 'REFRESH_TOKEN_TTL_SECONDS', fallback: number) {
  const configured = process.env[name]?.trim()
  if (!configured) return fallback
  const seconds = Number(configured)
  if (!Number.isSafeInteger(seconds) || seconds < 1) throw new Error(`${name} must be a positive integer`)
  return seconds
}

export function accessTokenTtlSeconds() {
  return ttlSeconds('ACCESS_TOKEN_TTL_SECONDS', DEFAULT_ACCESS_TTL_SECONDS)
}

export function refreshTokenTtlSeconds() {
  return ttlSeconds('REFRESH_TOKEN_TTL_SECONDS', DEFAULT_REFRESH_TTL_SECONDS)
}

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
  const exp = accessTokenTtlSeconds()
  return new SignJWT({ ver: payload.ver ?? 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${exp}s`)
    .sign(getJwtSecret())
}

export async function issueRefreshToken(payload: { sub: string; ver?: number }) {
  const exp = refreshTokenTtlSeconds()
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
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...cookieOptions(), maxAge: accessTokenTtlSeconds() })
}

export function setAuthCookies(res: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions(), maxAge: accessTokenTtlSeconds() })
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions(), maxAge: refreshTokenTtlSeconds() })
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(), maxAge: 0 })
}
