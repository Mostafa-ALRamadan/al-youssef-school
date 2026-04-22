import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  typedRoutes: true,
  // Reduce build size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Use Turbopack (default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
