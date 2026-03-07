/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', '@prisma/client'],
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Allow large payloads for report generation
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '50mb',
  },
};

module.exports = nextConfig;
