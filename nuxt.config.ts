export default defineNuxtConfig({
  compatibilityDate: '2025-10-30',
  devtools: { enabled: false },
  modules: ['@vueuse/nuxt', '@nuxt/ui'],
  ssr: false,
  app: {
    head: {
      meta: [{ name: 'referrer', content: 'no-referrer' }],
    },
  },
  nitro: {
    minify: process.env.NODE_ENV === 'production',
    storage: {
      kv: {
        driver: 'cloudflare-kv-binding',
        binding: 'kv',
      },
    },
  },
});
