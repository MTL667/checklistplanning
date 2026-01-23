// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Use app/ directory for source code (Nuxt 4 style but without full compatibility mode)
  srcDir: 'app/',

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: false // Disable in production builds
  },

  // Build optimizations
  vite: {
    build: {
      // Reduce memory usage
      sourcemap: false,
      // Disable reporting to save memory
      reportCompressedSize: false,
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    // Reduce memory during build
    optimizeDeps: {
      holdUntilCrawlEnd: false
    }
  },

  nitro: {
    // Reduce server build time
    sourceMap: false,
    // Reduce memory usage during build
    minify: false,
    // Disable compression to speed up build
    compressPublicAssets: false,
    // Disable rollup bundling analysis
    analyze: false
  },

  // Icon configuration - use API mode to reduce bundle size
  icon: {
    serverBundle: 'remote',
    clientBundle: {
      scan: true
    }
  },

  css: ['~/assets/css/main.css'],

  // i18n configuration
  i18n: {
    locales: [
      { code: 'nl', name: 'Nederlands', file: 'nl.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' }
    ],
    defaultLocale: 'nl',
    lazy: true,
    langDir: '../i18n/locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'nl'
    },
    bundle: {
      optimizeTranslationDirective: false
    }
  },

  // Runtime configuration
  runtimeConfig: {
    // Server-side only (not exposed to client)
    databaseUrl: process.env.DATABASE_URL,
    entraClientId: process.env.NUXT_ENTRA_CLIENT_ID,
    entraClientSecret: process.env.NUXT_ENTRA_CLIENT_SECRET,
    entraTenantId: process.env.NUXT_ENTRA_TENANT_ID || 'common',
    // Session password for nuxt-auth-utils (accepts both names)
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || process.env.NUXT_SESSION_SECRET || ''
    },

    // Public (exposed to client)
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      appName: 'Planning Checklist'
    }
  },

  // Route rules
  routeRules: {
    '/api/**': { cors: false }
  },

  // TypeScript
  typescript: {
    strict: true
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
