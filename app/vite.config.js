import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        '/save-game': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
        '/create-user': {
          target: env.VITE_BACKEND_URL,      // ← use the Docker-network host
          changeOrigin: true,
          secure: false,                     // ← in case it’s http
        },
        '/api': {
          target: env.VITE_BACKEND_URL,      // ← use the Docker-network host
          changeOrigin: true,
          secure: false,                     // ← in case it’s http
        },
        '/unlock-achievement': {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
        '/Games':               { target: env.VITE_BACKEND_URL, changeOrigin: true },
      },
      watch: {
        usePolling: true,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      transformMode: {
        web: [/\.[jt]sx?$/]
      },
      coverage: {
        reporter: ['text', 'html'], 
        reportsDirectory: './coverage',
        exclude: [
          'eslint.config.*',
          'vite.config.*',
          '**/*.d.ts',
          'node_modules/',
          'tests/',
          '**/*.test.*',
          'coverage/',
          'dist/'
        ],
      },
    },
  });
};
