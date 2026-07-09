import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.openfoodfacts.org',
      },
      {
        protocol: 'https',
        hostname: '**.openfoodfacts.net',
      },
    ],
  },
};

export default nextConfig;