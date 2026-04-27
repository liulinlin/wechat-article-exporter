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
  runtimeConfig: {
    // 逗号分隔的代理节点，如 "https://00.codeby.cc,https://01.codeby.cc"
    proxyHosts: process.env.NITRO_PROXY_HOSTS || 'https://00.codeby.cc,https://01.codeby.cc,https://02.codeby.cc',
  },
  nitro: {
    minify: process.env.NODE_ENV === 'production',
    storage: {
      kv: {
        driver: process.env.NITRO_KV_DRIVER || 'memory',
        base: process.env.NITRO_KV_BASE,
      },
    },
  },
});
