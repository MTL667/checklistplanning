<script setup lang="ts">
const { t } = useI18n()
const { user, clear, fetch: refreshSession } = useUserSession()
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

// Impersonation
const isImpersonating = computed(() => user.value?.isImpersonating === true)
const showImpersonateModal = ref(false)
const { data: planners } = await useFetch('/api/users', { server: false })
const plannersList = computed(() => (planners.value || []).filter(u => u.role === 'PLANNER'))
const isImpersonatingUser = ref(false)

async function impersonateUser(userId: string) {
  isImpersonatingUser.value = true
  try {
    await $fetch('/api/admin/impersonate', {
      method: 'POST',
      body: { userId }
    })
    await refreshSession()
    showImpersonateModal.value = false
    await navigateTo('/dashboard')
  } catch (error) {
    console.error('Failed to impersonate:', error)
  } finally {
    isImpersonatingUser.value = false
  }
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
      </nav>

      <!-- Impersonate Button -->
      <div v-if="!isImpersonating" class="border-t border-gray-200 p-4 dark:border-gray-800">
        <UButton
          icon="i-lucide-eye"
          label="Impersonate planner"
          variant="outline"
          color="neutral"
          size="sm"
          block
          @click="showImpersonateModal = true"
        />
      </div>

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

    <!-- Impersonate Modal -->
    <Teleport to="body">
      <div v-if="showImpersonateModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showImpersonateModal = false" />
        <div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Impersonate planner
            </h3>
            <button class="text-gray-400 hover:text-gray-600" @click="showImpersonateModal = false">
              <UIcon name="i-lucide-x" class="h-5 w-5" />
            </button>
          </div>

          <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Selecteer een planner om het paneel te bekijken vanuit hun perspectief.
          </p>

          <div class="max-h-64 space-y-2 overflow-y-auto">
            <button
              v-for="planner in plannersList"
              :key="planner.id"
              class="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
              :disabled="isImpersonatingUser"
              @click="impersonateUser(planner.id)"
            >
              <UAvatar :alt="planner.name" size="sm" />
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">{{ planner.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ planner.email }}</p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="h-4 w-4 text-gray-400" />
            </button>

            <p v-if="!plannersList.length" class="py-4 text-center text-gray-500 dark:text-gray-400">
              Geen planners gevonden
            </p>
          </div>

          <div class="mt-4 flex justify-end">
            <UButton label="Annuleren" variant="ghost" @click="showImpersonateModal = false" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
