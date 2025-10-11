import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  basePath: (process.env.NODE_ENV!=="production") ? '/pwa/out' : '',
  trailingSlash: false,
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
  swcMinify: true,
  transpilePackages: [
    '@ionic/react',
    '@ionic/core',
    '@stencil/core',
    'ionicons',
  ],
};

export default nextConfig;