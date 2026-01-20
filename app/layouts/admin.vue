<script setup lang="ts">
const { t } = useI18n()
const { user, clear } = useUserSession()
const route = useRoute()

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

const navItems = computed(() => [
  { label: t('nav.dashboard'), to: '/admin', icon: 'i-lucide-layout-dashboard' },
  { label: t('nav.planners'), to: '/admin/users', icon: 'i-lucide-users' },
  { label: t('nav.inspectors'), to: '/admin/inspectors', icon: 'i-lucide-user-check' },
  { label: t('nav.targets'), to: '/admin/targets', icon: 'i-lucide-target' },
  { label: t('nav.tasks'), to: '/admin/tasks', icon: 'i-lucide-list-checks' },
  { label: t('nav.absences'), to: '/admin/absences', icon: 'i-lucide-calendar-off' },
  { label: t('nav.reports'), to: '/admin/reports', icon: 'i-lucide-bar-chart-3' }
])

const isActive = (path: string) => {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
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
      </nav>

      <!-- User Info -->
      <div class="border-t border-gray-200 p-4 dark:border-gray-800">
        <div class="flex items-center gap-3">
          <UAvatar :alt="user?.name" size="sm" />
          <div class="flex-1 overflow-hidden">
            <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
              {{ user?.name }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ t(`roles.${user?.role?.toLowerCase()}`) }}
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
      </div>
    </aside>

    <!-- Main Content -->
    <div class="ml-64 flex-1">
      <!-- Header -->
      <header class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-950">
        <slot name="header">
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard.title') }}
          </h1>
        </slot>

        <div class="flex items-center gap-4">
          <RealtimeStatus />
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
