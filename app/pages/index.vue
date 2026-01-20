<script setup lang="ts">
const { t } = useI18n()
const { loggedIn, user } = useUserSession()
const route = useRoute()

// Check for auth errors in query params
const authError = computed(() => {
  const error = route.query.error as string
  if (!error) return null

  const errorMessages: Record<string, string> = {
    no_code: 'Authentication failed - no authorization code received',
    state_mismatch: 'Authentication failed - security check failed',
    invalid_claims: 'Authentication failed - invalid user information',
    token_exchange_failed: 'Authentication failed - could not complete login'
  }

  return errorMessages[error] || `Authentication error: ${error}`
})

// Redirect to dashboard if already logged in
onMounted(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="flex items-center justify-end p-4">
      <LanguageToggle />
    </header>

    <!-- Main Content -->
    <main class="flex flex-1 flex-col items-center justify-center px-4">
      <div class="w-full max-w-md text-center">
        <!-- Logo/Title -->
        <div class="mb-8">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-500">
            <UIcon name="i-lucide-clipboard-check" class="h-8 w-8 text-white" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ t('app.name') }}
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            {{ t('app.welcome') }}
          </p>
        </div>

        <!-- Error Alert -->
        <UAlert
          v-if="authError"
          color="error"
          :title="t('errors.generic')"
          :description="authError"
          class="mb-6"
        />

        <!-- Login Card -->
        <UCard class="text-left">
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('auth.login') }}
            </h2>
          </template>

          <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
            {{ t('auth.loginWithMicrosoft') }}
          </p>

          <UButton
            :label="t('auth.loginWithMicrosoft')"
            icon="i-simple-icons-microsoft"
            size="lg"
            block
            to="/auth/microsoft"
            external
          />
        </UCard>

        <!-- Health Status -->
        <div class="mt-8">
          <HealthStatus />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
      © {{ new Date().getFullYear() }} Planning Checklist
    </footer>
  </div>
</template>
