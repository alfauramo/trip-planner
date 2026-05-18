/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Trip Planner',
        short_name: 'Trip Planner',
        description: 'Planifica y organiza tus viajes',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/trip-planner/',
        start_url: '/trip-planner/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^.]*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 30 },
            },
          },
        ],
      },
    }),
  ],
  base: '/trip-planner/',
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@dnd-kit')) return 'vendor-dnd';
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-maps';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
