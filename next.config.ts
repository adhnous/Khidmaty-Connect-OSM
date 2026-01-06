import type { NextConfig } from 'next';
import { join } from 'node:path';

const isCIOrProd =
  process.env.CI === 'true' || process.env.NODE_ENV === 'production';

const projectRoot = process.cwd();
const reactAlias = join(projectRoot, 'node_modules', 'react');
const reactDomAlias = join(projectRoot, 'node_modules', 'react-dom');

// CSP: keep dev permissive for tooling, tighten in CI/prod.
const cspScriptSrc = isCIOrProd
  ? "script-src 'self' 'unsafe-inline' https:"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:";

// Global security headers for all pages + API routes
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      cspScriptSrc,
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

  // Turbopack (dev): force a single React instance to avoid invalid hook call issues.
  turbopack: {
    resolveAlias: {
      react: reactAlias,
      'react-dom': reactDomAlias,
    },
  },

  // Re-enable type and lint checks for CI/prod; keep relaxed in dev for velocity
  typescript: {
    ignoreBuildErrors: !isCIOrProd,
  },
  eslint: {
    ignoreDuringBuilds: !isCIOrProd,
    // Limit linting to the main app only (owner-console is a separate app).
    dirs: ['src'],
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
<<<<<<< HEAD
<<<<<<< HEAD
      // Only force React aliases in dev. In prod builds, Next relies on
      // conditional exports (e.g. `react-server`) and overriding can break
      // server-side helpers that use `React.cache`.
      ...(!isCIOrProd
        ? { react: reactAlias, 'react-dom': reactDomAlias }
        : {}),
=======
      react: reactAlias,
      'react-dom': reactDomAlias,
>>>>>>> 5fe260e (fix(logo))
=======
      react: reactAlias,
      'react-dom': reactDomAlias,
>>>>>>> 5fe260e (fix(logo))
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/exporter-zipkin': false,
    };
    return config;
  },
};

export default nextConfig;
