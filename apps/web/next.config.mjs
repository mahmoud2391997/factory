/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@erp/database'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
