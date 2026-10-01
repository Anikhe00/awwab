/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH lets GitHub Pages serve from /<repo>/ ; Vercel uses '/'.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // the on-device Whisper bundle is opt-in and downloaded on demand
        globIgnores: ['**/transformers*.js'],
        navigateFallback: 'index.html',
        // opt-in Whisper runtime: cached the first time it is used, then works offline
        runtimeCaching: [{ urlPattern: /\.wasm$|transformers\.web/, handler: 'CacheFirst', options: { cacheName: 'whisper-runtime' } }],
      },
      manifest: {
        name: 'Awwab',
        short_name: 'Awwab',
        description: 'A calm companion for reading the Qur’an consistently.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f1e7',
        theme_color: '#2f5d50',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  // use the assigned PORT when one is provided (e.g. by the preview tool)
  server: { port: Number(process.env.PORT) || 5173 },
  preview: { port: Number(process.env.PORT) || 4173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
