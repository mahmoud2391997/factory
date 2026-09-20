import { NextResponse } from 'next/server'

import { ensureDatabaseUrlEnv, resolveDatabaseUrl } from '@erp/database/env'

export function getDatabaseUrl() {
  return ensureDatabaseUrlEnv() ?? resolveDatabaseUrl()
}

export function getJwtSecretRaw() {
  const value = process.env.JWT_SECRET?.trim() ?? ''
  return value.length > 0 ? value : null
}

export function assertAuthEnv() {
  if (!getDatabaseUrl()) {
    return {
      ok: false as const,
      status: 503,
      message:
        'إعداد قاعدة البيانات ناقص: عيّن DATABASE_URL (أو POSTGRES_PRISMA_URL / POSTGRES_URL من Vercel Postgres) في Environment Variables ثم أعد النشر',
      code: 'DATABASE_URL_MISSING',
    }
  }
  if (!getJwtSecretRaw()) {
    return {
      ok: false as const,
      status: 503,
      message: 'إعداد الجلسة ناقص: عيّن JWT_SECRET في بيئة التشغيل',
      code: 'JWT_SECRET_MISSING',
    }
  }
  return { ok: true as const }
}

export function toApiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('JWT_SECRET')) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'إعداد الجلسة ناقص: عيّن JWT_SECRET في بيئة التشغيل',
        code: 'JWT_SECRET_MISSING',
      },
    }
  }

  if (
    message.includes('DATABASE_URL') ||
    message.includes("Can't reach database") ||
    message.includes('P1001') ||
    message.includes('P1012') ||
    message.includes('ECONNREFUSED')
  ) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'تعذر الاتصال بقاعدة البيانات. تحقق من DATABASE_URL / POSTGRES_URL وأن Postgres متاح.',
        code: 'DATABASE_UNAVAILABLE',
      },
    }
  }

  if (message.includes('P2021') || message.includes('does not exist') || message.includes('P2010')) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'جداول النظام غير موجودة بعد. شغّل ترحيل قاعدة البيانات ثم نفّذ /api/setup/bootstrap.',
        code: 'SCHEMA_MISSING',
      },
    }
  }

  return {
    status: 500,
    body: {
      success: false as const,
      message: 'حدث خطأ غير متوقع أثناء المصادقة',
      code: 'AUTH_INTERNAL_ERROR',
    },
  }
}

export function jsonError(status: number, message: string, code?: string, errors?: unknown) {
  return NextResponse.json({ success: false, message, code, errors }, { status })
}
