import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['robohash.org'], 
    unoptimized: true,
  },
};

export default nextConfig;
