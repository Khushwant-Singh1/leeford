import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "leeford.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**", // This allows all images from this bucket
      },
    ],
  },
};

export default nextConfig;
