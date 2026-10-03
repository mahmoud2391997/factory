/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
