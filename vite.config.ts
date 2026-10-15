import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/kasa-ledger/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', '.nojekyll'],
      manifest: {
        name: 'Kasa Ledger — Personal Finance',
        short_name: 'Kasa',
        description: 'Local-first Personal Finance, Sinking Funds, and Asset/Deposit Management PWA',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#09090B',
        theme_color: '#09090B',
        start_url: '/kasa-ledger/',
        scope: '/kasa-ledger/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'zod'],
          icons: ['lucide-react'],
          pdf: ['jspdf', 'jspdf-autotable']
        }
      }
    }
  }
});
