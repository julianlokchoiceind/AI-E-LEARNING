/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'i.ytimg.com', 'img.youtube.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig