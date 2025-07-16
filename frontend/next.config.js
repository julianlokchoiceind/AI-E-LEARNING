/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost', 'i.ytimg.com', 'img.youtube.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Bundle optimization
  webpack: (config, { isServer, dev }) => {
    // Add case sensitivity check to catch errors during development
    const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
    config.plugins.push(new CaseSensitivePathsPlugin());
    
    // Reduce webpack messages in development
    if (dev && !isServer) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    
    // Explicit path resolution for production builds
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/hooks': require('path').resolve(__dirname, 'hooks'),
      '@/types': require('path').resolve(__dirname, 'types'),
      '@/stores': require('path').resolve(__dirname, 'stores'),
      '@/styles': require('path').resolve(__dirname, 'styles'),
    };
    
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }
    
    return config;
  },
  
  // NOTE: HTTP cache headers removed - CDN will handle HTTP caching
  // React Query handles all client-side caching for optimal performance
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
  
  // Redirects for SEO
  redirects: async () => [
    // Removed problematic /dashboard -> /dashboard redirect that caused infinite loop
  ],
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "ai-elearning",
  project: "frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  automaticVercelMonitors: true,
};

// Export with Sentry
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);