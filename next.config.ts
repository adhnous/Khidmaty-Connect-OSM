import type { NextConfig } from 'next';

const isCIOrProd =
  process.env.CI === 'true' || process.env.NODE_ENV === 'production';

// Global security headers for all pages + API routes
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, // anti‑clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'geolocation=(self), microphone=(), camera=(), payment=(), fullscreen=(self)',
  },
];

const nextConfig: NextConfig = {
  // Disable React Strict Mode to avoid double-mount issues with Leaflet in dev
  reactStrictMode: false,

  // Re-enable type and lint checks for CI/prod; keep relaxed in dev for velocity
  typescript: {
    ignoreBuildErrors: !isCIOrProd,
  },
  eslint: {
    ignoreDuringBuilds: !isCIOrProd,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Apply security headers everywhere
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/exporter-zipkin': false,
    };
    return config;
  },
};

export default nextConfig;
