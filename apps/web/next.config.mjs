/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@erp/database'],
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
