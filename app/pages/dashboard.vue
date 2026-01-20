<script setup lang="ts">
definePageMeta({
  layout: 'planner',
  middleware: 'auth'
})

const { t } = useI18n()
const { user } = useUserSession()

// Redirect admins to admin dashboard
onMounted(() => {
  if (user.value?.role === 'ADMIN') {
    navigateTo('/admin')
  }
})

// Get today's date
const today = new Date().toISOString().split('T')[0]

// Fetch today's data
const { data: checklistData } = await useFetch('/api/checklist/entries', {
  query: { date: today }
})

const { data: summaryData } = await useFetch('/api/turnover/summary')

// Calculate checklist progress
const checklistProgress = computed(() => {
  if (!checklistData.value || checklistData.value.length === 0) return 0
  const completed = checklistData.value.filter(t => t.completed).length
  return Math.round((completed / checklistData.value.length) * 100)
})

const checklistCompleted = computed(() => {
  return checklistData.value?.filter(t => t.completed).length || 0
})

const checklistTotal = computed(() => {
  return checklistData.value?.length || 0
})

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<template>
  <div>
    <!-- Welcome Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('app.welcome') }}, {{ user?.name }}!
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        {{ new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Checklist Progress -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="{
            'bg-green-100 dark:bg-green-900': checklistProgress === 100,
            'bg-yellow-100 dark:bg-yellow-900': checklistProgress > 0 && checklistProgress < 100,
            'bg-gray-100 dark:bg-gray-800': checklistProgress === 0
          }">
            <UIcon
              name="i-lucide-list-checks"
              class="h-6 w-6"
              :class="{
                'text-green-600 dark:text-green-400': checklistProgress === 100,
                'text-yellow-600 dark:text-yellow-400': checklistProgress > 0 && checklistProgress < 100,
                'text-gray-600 dark:text-gray-400': checklistProgress === 0
              }"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('nav.checklist') }}
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ checklistCompleted }} / {{ checklistTotal }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Today's Turnover -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <UIcon name="i-lucide-euro" class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('dashboard.todayTurnover') }}
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(summaryData?.dailyTotals?.[today] || 0) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Weekly Total -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <UIcon name="i-lucide-trending-up" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('turnover.weeklyTotal') }}
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(summaryData?.weeklyTotal || 0) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Inspector Count -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <UIcon name="i-lucide-users" class="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('dashboard.totalInspectors') }}
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ summaryData?.inspectorCount || 0 }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('common.actions') }}
      </h3>
      <div class="grid gap-4 sm:grid-cols-3">
        <UCard
          as="NuxtLink"
          to="/turnover"
          class="transition-shadow hover:shadow-lg"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
              <UIcon name="i-lucide-euro" class="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ t('nav.turnover') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('turnover.enterAmount') }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard
          as="NuxtLink"
          to="/checklist"
          class="transition-shadow hover:shadow-lg"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <UIcon name="i-lucide-list-checks" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ t('nav.checklist') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ checklistCompleted }}/{{ checklistTotal }} {{ t('checklist.completed').toLowerCase() }}
              </p>
            </div>
          </div>
        </UCard>

        <UCard
          as="NuxtLink"
          to="/summary"
          class="transition-shadow hover:shadow-lg"
        >
          <div class="flex items-center gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <UIcon name="i-lucide-bar-chart-3" class="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ t('nav.summary') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('turnover.successDays') }}: {{ summaryData?.successfulDays || 0 }}/{{ summaryData?.totalDays || 5 }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Today's Checklist Preview -->
    <UCard v-if="checklistData && checklistData.length > 0">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ t('checklist.title') }}
          </h3>
          <NuxtLink to="/checklist" class="text-sm text-primary-600 hover:underline dark:text-primary-400">
            {{ t('common.actions') }} →
          </NuxtLink>
        </div>
      </template>

      <div class="space-y-2">
        <div
          v-for="task in checklistData.slice(0, 5)"
          :key="task.id"
          class="flex items-center gap-3"
        >
          <div
            class="flex h-5 w-5 items-center justify-center rounded-full"
            :class="task.completed ? 'bg-green-500' : 'border-2 border-gray-300 dark:border-gray-600'"
          >
            <UIcon v-if="task.completed" name="i-lucide-check" class="h-3 w-3 text-white" />
          </div>
          <span
            :class="task.completed
              ? 'text-gray-500 line-through dark:text-gray-400'
              : 'text-gray-900 dark:text-white'"
          >
            {{ task.nameNl }}
          </span>
        </div>
        <p v-if="checklistData.length > 5" class="text-sm text-gray-500 dark:text-gray-400">
          +{{ checklistData.length - 5 }} more tasks
        </p>
      </div>
    </UCard>
  </div>
</template>
