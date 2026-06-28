import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@trpc/server', '@trpc/client', '@trpc/react-query'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Tailwind CSS v4: ใช้ postcss plugin ผ่าน webpack (ปิด Turbopack จะ fallback มาที่นี่)
};

export default nextConfig;
