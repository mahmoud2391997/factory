/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '**.run.app',
    '*.run.app',
    'ais-dev-nfttwnhx2mfrazy3mhvjjz-490282511986.europe-west2.run.app',
    'ais-pre-nfttwnhx2mfrazy3mhvjjz-490282511986.europe-west2.run.app',
    'localhost',
    '127.0.0.1',
  ],
}

export default nextConfig
