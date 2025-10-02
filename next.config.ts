import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  serverExternalPackages: ["@supabase/ssr"],
  // Use separate tsconfig for build to exclude test files
  typescript: {
    tsconfigPath: (process.env.NODE_ENV == 'production' ? './tsconfig.build.json' : "./tsconfig.json"),
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
