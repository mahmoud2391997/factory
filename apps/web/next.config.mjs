/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '**.run.app',
    '*.run.app',
    'localhost',
    '127.0.0.1',
  ],
}

export default nextConfig
