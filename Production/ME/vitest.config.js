import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*.config.jsx',
        'dist/',
        'build/',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 45,
        statements: 60,
      },
    },
    include: ['src/**/*.{test,spec}.{js,jsx}', 'tests/unit/**/*.{test,spec}.{js,jsx}', 'tests/integration/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules/', 'dist/', '.idea/', '.git/', '.cache/'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@components': path.resolve(import.meta.dirname, './src/components'),
      '@pages': path.resolve(import.meta.dirname, './src/pages'),
      '@layouts': path.resolve(import.meta.dirname, './src/layouts'),
      '@context': path.resolve(import.meta.dirname, './src/context'),
      '@services': path.resolve(import.meta.dirname, './src/services'),
      '@data': path.resolve(import.meta.dirname, './src/data'),
      '@routes': path.resolve(import.meta.dirname, './src/routes'),
    },
  },
});
