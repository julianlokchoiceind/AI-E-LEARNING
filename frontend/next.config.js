/** @type {import('next').NextConfig} */

const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['localhost', 'i.ytimg.com', 'img.youtube.com', 'storage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/ai-elearning-uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/choiceind-ai-elearning-images/**',
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
  
  // Security headers - Allow eval in dev mode for React DevTools/HMR
  async headers() {
    return [
      {
        source: '/(.*)',  // Match ALL paths including root
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "script-src 'self' 'unsafe-eval' 'unsafe-inline';" 
              : "script-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
  
  // Output configuration for Docker deployment
  output: 'standalone',

  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // optimizeCss: true, // Disabled for Cloud Run compatibility
    scrollRestoration: true,
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Redirects for SEO
  redirects: async () => [
    // Removed problematic /dashboard -> /dashboard redirect that caused infinite loop
  ],
}


// Export Next.js config
module.exports = nextConfig;