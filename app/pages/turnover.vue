<script setup lang="ts">
definePageMeta({
  layout: 'planner',
  middleware: 'auth'
})

const { t } = useI18n()
const toast = useToast()

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

// Generate week days
const weekDays = computed(() => {
  const days = []
  const start = new Date(currentWeekStart.value)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push({
      date: formatDate(date),
      dayName: date.toLocaleDateString('nl-NL', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isWeekend: i >= 5
    })
  }
  return days
})

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

// Format week range for display
const weekRangeLabel = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startStr = start.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  return `${startStr} - ${endStr}`
})

// Fetch data
const startDateStr = computed(() => formatDate(currentWeekStart.value))
const endDateStr = computed(() => {
  const end = new Date(currentWeekStart.value)
  end.setDate(end.getDate() + 6)
  return formatDate(end)
})

const { data: inspectorsData, refresh: refreshEntries } = await useFetch('/api/turnover/entries', {
  query: computed(() => ({
    startDate: startDateStr.value,
    endDate: endDateStr.value
  })),
  watch: [startDateStr]
})

const { data: summaryData, refresh: refreshSummary } = await useFetch('/api/turnover/summary', {
  query: computed(() => ({
    startDate: startDateStr.value,
    endDate: endDateStr.value
  })),
  watch: [startDateStr]
})

// Local entry state for editing
const localEntries = ref<Record<string, Record<string, number>>>({})

// Initialize local entries from server data
watch(inspectorsData, (data) => {
  if (data) {
    const entries: Record<string, Record<string, number>> = {}
    data.forEach(inspector => {
      entries[inspector.id] = { ...inspector.entries }
    })
    localEntries.value = entries
  }
}, { immediate: true })

// Save entry with debounce
const savingEntries = ref<Record<string, boolean>>({})

async function saveEntry(inspectorId: string, date: string, amount: number) {
  const key = `${inspectorId}-${date}`
  savingEntries.value[key] = true

  try {
    await $fetch('/api/turnover/entries', {
      method: 'POST',
      body: { inspectorId, date, amount }
    })

    // Update local state
    if (!localEntries.value[inspectorId]) {
      localEntries.value[inspectorId] = {}
    }
    localEntries.value[inspectorId][date] = amount

    // Refresh summary
    await refreshSummary()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to save',
      color: 'error'
    })
  } finally {
    savingEntries.value[key] = false
  }
}

// Handle input change with debounce
const debounceTimers: Record<string, NodeJS.Timeout> = {}

function handleInputChange(inspectorId: string, date: string, value: string) {
  const amount = parseFloat(value) || 0

  // Update local state immediately
  if (!localEntries.value[inspectorId]) {
    localEntries.value[inspectorId] = {}
  }
  localEntries.value[inspectorId][date] = amount

  // Debounce save
  const key = `${inspectorId}-${date}`
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key])
  }
  debounceTimers[key] = setTimeout(() => {
    saveEntry(inspectorId, date, amount)
  }, 500)
}

// Get entry value
function getEntryValue(inspectorId: string, date: string): number {
  return localEntries.value[inspectorId]?.[date] || 0
}

// Calculate row total
function getRowTotal(inspectorId: string): number {
  const entries = localEntries.value[inspectorId] || {}
  return Object.values(entries).reduce((sum, val) => sum + (val || 0), 0)
}

// Calculate column total
function getColumnTotal(date: string): number {
  let total = 0
  Object.values(localEntries.value).forEach(entries => {
    total += entries[date] || 0
  })
  return total
}

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
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('turnover.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ inspectorsData?.length || 0 }} {{ t('nav.inspectors').toLowerCase() }}
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
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <UIcon name="i-lucide-euro" class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('turnover.weeklyTotal') }}
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(summaryData?.weeklyTotal || 0) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <UIcon name="i-lucide-calculator" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('turnover.inspectorAverage') }}
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(summaryData?.inspectorAverage || 0) }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <UIcon name="i-lucide-calendar-check" class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('turnover.successDays') }}
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ summaryData?.successfulDays || 0 }} / {{ summaryData?.totalDays || 5 }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
            <UIcon name="i-lucide-users" class="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('dashboard.totalInspectors') }}
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ summaryData?.inspectorCount || 0 }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Turnover Grid -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[800px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('inspector.name') }}
              </th>
              <th
                v-for="day in weekDays"
                :key="day.date"
                class="px-2 py-3 text-center text-sm font-medium"
                :class="day.isWeekend ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'"
              >
                <div>{{ day.dayName }}</div>
                <div class="text-xs">{{ day.dayNumber }}</div>
              </th>
              <th class="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('common.total') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inspector in inspectorsData"
              :key="inspector.id"
              class="border-b border-gray-100 dark:border-gray-800"
            >
              <td class="px-4 py-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ inspector.name }}
                </span>
              </td>
              <td
                v-for="day in weekDays"
                :key="day.date"
                class="px-1 py-1"
              >
                <input
                  type="number"
                  :value="getEntryValue(inspector.id, day.date) || ''"
                  :disabled="day.isWeekend"
                  class="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-center text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:disabled:bg-gray-900"
                  :class="{
                    'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30': getEntryValue(inspector.id, day.date) >= (inspector.defaultTarget || 0) && getEntryValue(inspector.id, day.date) > 0
                  }"
                  placeholder="0"
                  min="0"
                  step="1"
                  @input="(e) => handleInputChange(inspector.id, day.date, (e.target as HTMLInputElement).value)"
                />
              </td>
              <td class="px-4 py-2 text-right">
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(getRowTotal(inspector.id)) }}
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-gray-50 dark:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {{ t('turnover.dailyTotal') }}
              </td>
              <td
                v-for="day in weekDays"
                :key="day.date"
                class="px-2 py-3 text-center font-semibold text-gray-900 dark:text-white"
              >
                {{ formatCurrency(getColumnTotal(day.date)) }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-primary-600 dark:text-primary-400">
                {{ formatCurrency(summaryData?.weeklyTotal || 0) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </UCard>
  </div>
</template>
