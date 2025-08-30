import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enables the standalone output mode, crucial for Docker optimization
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // Reads the allowed origin from environment variables for flexibility
            value: process.env.NODE_ENV === 'development' 
              ? process.env.ALLOWED_ORIGIN_DEV || 'http://localhost:3000'
              : process.env.ALLOWED_ORIGIN_PROD || 'https://www.leeford.in',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "leeford.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;