// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.css'],

  build: {
    transpile: ['vuetify'],
  },

  app: {
    head: {
      title: '配送路径优化系统',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [{ name: 'description', content: '个人商家配送路径优化工具' }],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '配送路径优化系统',
      short_name: '配送优化',
      description: '个人商家配送路径优化工具',
      theme_color: '#2c3e50',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },
});
