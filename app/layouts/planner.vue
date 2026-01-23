<script setup lang="ts">
const { t } = useI18n()
const { user, clear } = useUserSession()
const route = useRoute()

const isImpersonating = computed(() => user.value?.isImpersonating === true)
const isLoggingOut = ref(false)

async function logout() {
  isLoggingOut.value = true
  try {
    await $fetch('/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/')
  } finally {
    isLoggingOut.value = false
  }
}

// Static nav items (no user-dependent logic to avoid hydration mismatch)
const navItems = [
  { label: t('nav.dashboard'), to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: t('nav.turnover'), to: '/turnover', icon: 'i-lucide-euro' },
  { label: t('nav.checklist'), to: '/checklist', icon: 'i-lucide-list-checks' },
  { label: t('nav.summary'), to: '/summary', icon: 'i-lucide-bar-chart-3' }
]

// Admin link shown only on client side
const showAdminLink = computed(() => user.value?.role === 'ADMIN')

const isActive = (path: string) => {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900" :class="{ 'pt-10': isImpersonating }">
    <!-- Impersonation Banner -->
    <ImpersonationBanner />

    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950" :class="{ 'top-10': isImpersonating }">
      <!-- Logo -->
      <div class="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-800">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
          <UIcon name="i-lucide-clipboard-check" class="h-5 w-5 text-white" />
        </div>
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ t('app.name') }}
        </span>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
        >
          <UIcon :name="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </NuxtLink>

        <!-- Admin link (client-only to avoid hydration mismatch) -->
        <ClientOnly>
          <NuxtLink
            v-if="showAdminLink"
            to="/admin"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="isActive('/admin')
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'"
          >
            <UIcon name="i-lucide-settings" class="h-5 w-5" />
            Admin
          </NuxtLink>
        </ClientOnly>
      </nav>

      <!-- User Info -->
      <div class="border-t border-gray-200 p-4 dark:border-gray-800">
        <ClientOnly>
          <div class="flex items-center gap-3">
            <UAvatar :alt="user?.name" size="sm" />
            <div class="flex-1 overflow-hidden">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                {{ user?.name }}
              </p>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                {{ user?.role ? t(`roles.${user.role.toLowerCase()}`) : '' }}
              </p>
            </div>
            <UButton
              icon="i-lucide-log-out"
              variant="ghost"
              color="neutral"
              size="sm"
              :loading="isLoggingOut"
              @click="logout"
            />
          </div>
          <template #fallback>
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              <div class="flex-1">
                <div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="ml-64 flex-1">
      <!-- Header -->
      <header class="sticky z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950" :class="isImpersonating ? 'top-10' : 'top-0'">
        <slot name="header">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard.title') }}
          </h1>
        </slot>

        <div class="flex items-center gap-4">
          <ClientOnly>
            <RealtimeStatus />
          </ClientOnly>
          <LanguageToggle />
          <UColorModeButton />
        </div>
      </header>

      <!-- Page Content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
