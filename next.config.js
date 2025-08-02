/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: { 
    unoptimized: true 
  },
  turbopack: {},
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
