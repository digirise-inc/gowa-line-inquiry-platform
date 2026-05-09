/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel serverless function に SQLite DB ファイルと Prisma engine を同梱
  outputFileTracingIncludes: {
    "/**/*": [
      "./prisma/dev.db",
      "./prisma/schema.prisma",
      "./node_modules/.prisma/client/**",
      "./node_modules/@prisma/client/**",
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "profile.line-scdn.net" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  typescript: {
    // Allow build to succeed even with type errors during demo
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
