/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@erp/database', '@erp/shared'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
