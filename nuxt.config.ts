import gitManager from 'git-rev-sync'

let build = 'dev'
try {
  build = gitManager.short()
}
catch {
  build = 'dev'
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3100
  },
  css: [
    './public/assets/css/main.css',
    './public/assets/font/pretendard/web/variable/pretendardvariable.css'
  ],
  runtimeConfig: {
    public: {
      apiEndpoint: process.env.API_ENDPOINT ?? 'http://127.0.0.1:4100',
      build
    }
  },
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    }
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: []
    }
  },
  icon: {
    serverBundle: {
      collections: ['mdi', 'fa6-solid', 'material-symbols'],
      externalizeIconsJson: true
    }
  },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxt/icon'
  ],
  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor'
      ]
    }
  }
})
