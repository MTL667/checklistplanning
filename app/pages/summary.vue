<script setup lang="ts">
definePageMeta({
  layout: 'planner',
  middleware: 'auth'
})

const { t, locale } = useI18n()

// Current week state
const currentWeekStart = ref(getMonday(new Date()))

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Week navigation
function previousWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() - 7)
  currentWeekStart.value = newDate
}

function nextWeek() {
  const newDate = new Date(currentWeekStart.value)
  newDate.setDate(newDate.getDate() + 7)
  currentWeekStart.value = newDate
}

function goToThisWeek() {
  currentWeekStart.value = getMonday(new Date())
}

const weekRangeLabel = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startStr = start.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  return `${startStr} - ${endStr}`
})

// Fetch data
const startDateStr = computed(() => formatDate(currentWeekStart.value))
const endDateStr = computed(() => {
  const end = new Date(currentWeekStart.value)
  end.setDate(end.getDate() + 6)
  return formatDate(end)
})

const { data: summaryData } = await useFetch('/api/turnover/summary', {
  query: computed(() => ({
    startDate: startDateStr.value,
    endDate: endDateStr.value
  })),
  watch: [startDateStr]
})

const { data: inspectorsData } = await useFetch('/api/turnover/entries', {
  query: computed(() => ({
    startDate: startDateStr.value,
    endDate: endDateStr.value
  })),
  watch: [startDateStr]
})

// Generate week days for the chart
const weekDays = computed(() => {
  const days = []
  const start = new Date(currentWeekStart.value)
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date: formatDate(date),
      dayName: date.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', { weekday: 'short' })
    })
  }
  return days
})

// Calculate inspector performance
const inspectorPerformance = computed(() => {
  if (!inspectorsData.value) return []

  return inspectorsData.value.map(inspector => {
    const total = Object.values(inspector.entries).reduce((sum, val) => sum + (val as number || 0), 0)
    const entryCount = Object.values(inspector.entries).filter(v => v > 0).length
    const average = entryCount > 0 ? total / entryCount : 0
    const target = inspector.defaultTarget || 0
    const weeklyTarget = target * 5

    return {
      id: inspector.id,
      name: inspector.name,
      total,
      average: Math.round(average),
      target,
      weeklyTarget,
      performance: weeklyTarget > 0 ? Math.round((total / weeklyTarget) * 100) : 0,
      entryCount
    }
  }).sort((a, b) => b.total - a.total)
})

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Get performance color
function getPerformanceColor(performance: number): string {
  if (performance >= 100) return 'green'
  if (performance >= 80) return 'yellow'
  return 'red'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.summary') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ weekRangeLabel }}
        </p>
      </div>

      <!-- Week Navigation -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          size="sm"
          @click="previousWeek"
        />
        <UButton
          :label="weekRangeLabel"
          variant="outline"
          size="sm"
          @click="goToThisWeek"
        />
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          size="sm"
          @click="nextWeek"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('turnover.weeklyTotal') }}
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(summaryData?.weeklyTotal || 0) }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('turnover.inspectorAverage') }}
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(summaryData?.inspectorAverage || 0) }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('turnover.successDays') }}
          </p>
          <p class="mt-2 text-3xl font-bold" :class="{
            'text-green-600 dark:text-green-400': (summaryData?.successfulDays || 0) >= 4,
            'text-yellow-600 dark:text-yellow-400': (summaryData?.successfulDays || 0) >= 2 && (summaryData?.successfulDays || 0) < 4,
            'text-red-600 dark:text-red-400': (summaryData?.successfulDays || 0) < 2
          }">
            {{ summaryData?.successfulDays || 0 }} / {{ summaryData?.totalDays || 5 }}
          </p>
        </div>
      </UCard>

      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('dashboard.totalInspectors') }}
          </p>
          <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {{ summaryData?.inspectorCount || 0 }}
          </p>
        </div>
      </UCard>
    </div>

    <!-- Daily Breakdown -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ t('turnover.daily') }}
        </h3>
      </template>

      <div class="grid grid-cols-5 gap-4">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="text-center"
        >
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ day.dayName }}
          </p>
          <p class="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(summaryData?.dailyTotals?.[day.date] || 0) }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Inspector Performance -->
    <UCard>
      <template #header>
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ t('inspector.title') }} - Performance
        </h3>
      </template>

      <div class="space-y-4">
        <div
          v-for="inspector in inspectorPerformance"
          :key="inspector.id"
          class="flex items-center gap-4"
        >
          <div class="w-32 shrink-0">
            <p class="font-medium text-gray-900 dark:text-white">
              {{ inspector.name }}
            </p>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500': inspector.performance >= 100,
                    'bg-yellow-500': inspector.performance >= 80 && inspector.performance < 100,
                    'bg-red-500': inspector.performance < 80
                  }"
                  :style="{ width: `${Math.min(inspector.performance, 100)}%` }"
                />
              </div>
              <span class="w-12 text-right text-sm font-medium" :class="{
                'text-green-600 dark:text-green-400': inspector.performance >= 100,
                'text-yellow-600 dark:text-yellow-400': inspector.performance >= 80 && inspector.performance < 100,
                'text-red-600 dark:text-red-400': inspector.performance < 80
              }">
                {{ inspector.performance }}%
              </span>
            </div>
          </div>

          <div class="w-24 text-right">
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(inspector.total) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              / {{ formatCurrency(inspector.weeklyTarget) }}
            </p>
          </div>
        </div>

        <div v-if="!inspectorPerformance.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
          {{ t('common.noData') }}
        </div>
      </div>
    </UCard>
  </div>
</template>
