import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/timemoney-app/' : '/',
  build: {
    target: ['es2015', 'chrome63', 'firefox67', 'safari11.1'],
    modulePreload: { polyfill: true },
    cssTarget: 'chrome61'
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // 強制快取更新
        skipWaiting: true,
        clientsClaim: true,
        // 新增版本號強制更新
        additionalManifestEntries: [{
          url: '/timemoney-app/',
          revision: Date.now().toString()
        }]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TimeMoney - 時間金錢管理',
        short_name: 'TimeMoney',
        description: '智慧型時間與金錢管理應用程式',
        theme_color: '#1f2937',
        background_color: '#111827',
        display: 'standalone',
        scope: '/timemoney-app/',
        start_url: '/timemoney-app/',
        orientation: 'portrait',
        icons: [
          {
            src: '/timemoney-app/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/timemoney-app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/timemoney-app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
