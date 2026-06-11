import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Sentry plugin for source maps upload (only in production builds)
    process.env.NODE_ENV === 'production' && process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/assets/**',
        filesToDeleteAfterUpload: ['**/*.js.map'],
      },
    }),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    chunkSizeWarningLimit: 1000,
    sourcemap: true, // Enable source maps for error tracking
    minify: 'esbuild', // Use esbuild for faster minification
    esbuild: {
      drop: ['console', 'debugger'], // Remove console.log and debugger in production
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux')) {
            return 'vendor-redux';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
          if (id.includes('node_modules/@sentry')) {
            return 'vendor-sentry';
          }
          if (id.includes('node_modules/socket.io-client')) {
            return 'vendor-socket';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Report compressed size
    reportCompressedSize: true,
    // Optimize chunk size
    cssCodeSplit: true,
  },
  
  // Preview server configuration (for testing production builds)
  preview: {
    port: 4173,
    strictPort: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    open: false,
  },
});
