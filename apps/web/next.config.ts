import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@aph/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  allowedDevOrigins: ['192.168.31.67', 'localhost', '127.0.0.1'],
  async rewrites() {
    if (!apiUrl) return [];

    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
