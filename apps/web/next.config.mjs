/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['@erp/database'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
