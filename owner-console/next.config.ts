import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is stable in Next.js 15+
  turbopack: {},
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
