import { NextResponse } from 'next/server'

import { getDemoSecrets, isDemoMode } from '@/server/demo'
import { ensureDatabaseUrlEnv, resolveDatabaseUrl } from '@/server/db-url'

export function getDatabaseUrl() {
  return ensureDatabaseUrlEnv() ?? resolveDatabaseUrl()
}

export function getJwtSecretRaw() {
  return process.env.JWT_SECRET?.trim() || (isDemoMode() ? getDemoSecrets().jwtSecret : '')
}

export function assertAuthEnv() {
  // Demo mode: no Postgres URL — still allow JWT-based demo login.
  if (isDemoMode()) {
    return { ok: true as const, demo: true as const }
  }
  if (!getJwtSecretRaw()) {
    return {
      ok: false as const,
      status: 503,
      message: 'إعداد الجلسة ناقص: عيّن JWT_SECRET في بيئة التشغيل',
      code: 'JWT_SECRET_MISSING',
    }
  }
  return { ok: true as const, demo: false as const }
}

export function toApiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('SERVICE_NOT_CONFIGURED')) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'الخدمة غير مهيأة',
        code: 'SERVICE_NOT_CONFIGURED',
      },
    }
  }

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
    message.includes('MONGODB_URI') ||
    message.includes('Server selection timed out') ||
    message.includes('MongoNetworkError') ||
    message.includes('MongoServerSelectionError') ||
    message.includes('bad auth') ||
    message.includes('Authentication failed') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED')
  ) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'تعذر الاتصال بقاعدة البيانات. تحقق من MONGODB_URI وأن MongoDB Atlas يسمح بالاتصال (Network Access).',
        code: 'DATABASE_UNAVAILABLE',
      },
    }
  }

  if (
    message.includes('إصدار بيانات المصنع') ||
    message.includes('ملف البيانات تالف') ||
    message.includes('schemaVersion')
  ) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'بيانات المصنع المحفوظة غير متوافقة مع هذا الإصدار. أعد تهيئة الوثيقة التشغيلية أو احذف الوثيقة main من مجموعة erp_documents ثم أعد الدخول.',
        code: 'ERP_STATE_INVALID',
      },
    }
  }

  if (message.includes('ERP_NOT_BOOTSTRAPPED')) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'النظام غير مهيأ بعد. نفّذ /api/setup/bootstrap مرة واحدة باستخدام SETUP_TOKEN.',
        code: 'ERP_NOT_BOOTSTRAPPED',
      },
    }
  }

  if (message.includes('E11000') || message.includes('duplicate key')) {
    return {
      status: 503,
      body: {
        success: false as const,
        message: 'تهيئة النظام جارية على السيرفر. أعد محاولة تسجيل الدخول بعد لحظات.',
        code: 'ERP_SEED_RACE',
      },
    }
  }

  return {
    status: 500,
    body: {
      success: false as const,
      message: 'حدث خطأ غير متوقع في الخادم',
      code: 'INTERNAL_ERROR',
    },
  }
}

export function jsonError(status: number, message: string, code?: string, errors?: unknown) {
  return NextResponse.json({ success: false, message, code, errors }, { status })
}
