import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_GIT_COMMIT_SHA:
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    NEXT_PUBLIC_BUILD_DATE: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
    NEXT_PUBLIC_APP_ENV: process.env.VERCEL ? 'vercel' : process.env.NEXT_PUBLIC_APP_ENV || 'local',
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '**.run.app',
    '*.run.app',
    'localhost',
    '127.0.0.1',
  ],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
