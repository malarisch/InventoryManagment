import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  trailingSlash: true,
  optimization: {
    minimize: (process.env.NODE_ENV == "production") ? true : false,
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
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true,
  },
  output: 'export',
  transpilePackages: [
    '@ionic/react',
    '@ionic/core',
    '@stencil/core',
    'ionicons',
  ],
  allowedDevOrigins: [
    'http://192.168.178.57:3000',
    'http://localhost:3000',
    '192.168.178.57'
  ],
};

export default nextConfig;