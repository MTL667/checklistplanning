<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t, locale } = useI18n()

// Week navigation
const selectedWeekStart = ref(getMonday(new Date()))

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function prevWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() - 7)
  selectedWeekStart.value = d.toISOString().split('T')[0]
}

function nextWeek() {
  const d = new Date(selectedWeekStart.value)
  d.setDate(d.getDate() + 7)
  selectedWeekStart.value = d.toISOString().split('T')[0]
}

function thisWeek() {
  selectedWeekStart.value = getMonday(new Date())
}

// Fetch report data
const { data: report, pending, refresh } = await useFetch('/api/reports/weekly', {
  query: { startDate: selectedWeekStart },
  watch: [selectedWeekStart]
})

// Export
function exportExcel() {
  window.open(`/api/reports/export?startDate=${selectedWeekStart.value}`, '_blank')
}

// Format helpers
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' }
  return date.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', options)
}

function getPerformanceColor(perf: number): string {
  if (perf >= 100) return 'text-green-600 dark:text-green-400'
  if (perf >= 80) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getPerformanceBg(perf: number): string {
  if (perf >= 100) return 'bg-green-100 dark:bg-green-900/30'
  if (perf >= 80) return 'bg-yellow-100 dark:bg-yellow-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.reports') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Weekly performance report
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-download"
          label="Export Excel"
          variant="outline"
          @click="exportExcel"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          variant="ghost"
          @click="refresh"
        />
      </div>
    </div>

    <!-- Week Selector -->
    <UCard class="mb-6">
      <div class="flex items-center justify-between">
        <UButton icon="i-lucide-chevron-left" variant="ghost" @click="prevWeek" />
        <div class="text-center">
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ report?.period?.startDate }} — {{ report?.period?.endDate }}
          </p>
          <UButton
            v-if="selectedWeekStart !== getMonday(new Date())"
            label="This week"
            variant="link"
            size="xs"
            @click="thisWeek"
          />
        </div>
        <UButton icon="i-lucide-chevron-right" variant="ghost" @click="nextWeek" />
      </div>
    </UCard>

    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="report">
      <!-- Summary Cards -->
      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Turnover</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(report.summary.totalTurnover) }}
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Weekly Target</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(report.summary.totalTarget) }}
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Performance</p>
            <p class="text-3xl font-bold" :class="getPerformanceColor(report.summary.performance)">
              {{ report.summary.performance }}%
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Avg per Inspector</p>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(report.summary.averagePerInspector) }}
            </p>
          </div>
        </UCard>
      </div>

      <!-- Daily Chart -->
      <UCard class="mb-6">
        <template #header>
          <h3 class="font-semibold text-gray-900 dark:text-white">Daily Totals</h3>
        </template>
        <div class="flex items-end justify-around gap-2" style="height: 200px">
          <div
            v-for="(day, index) in report.period.weekDays"
            :key="day"
            class="flex flex-1 flex-col items-center gap-2"
          >
            <div
              class="w-full rounded-t-lg transition-all"
              :class="[
                index >= 5 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary-500',
                report.dailyTotals[day] > 0 ? '' : 'opacity-30'
              ]"
              :style="{
                height: `${Math.max(
                  10,
                  (report.dailyTotals[day] / Math.max(...Object.values(report.dailyTotals), 1)) * 160
                )}px`
              }"
            />
            <div class="text-center">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                {{ formatDate(day) }}
              </p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(report.dailyTotals[day]) }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Inspector Table -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Inspector Performance ({{ report.inspectors.length }})
          </h3>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Inspector
                </th>
                <th
                  v-for="day in report.period.weekDays"
                  :key="day"
                  class="whitespace-nowrap px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {{ formatDate(day) }}
                </th>
                <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total
                </th>
                <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Target
                </th>
                <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Perf.
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="inspector in report.inspectors" :key="inspector.id">
                <td class="sticky left-0 z-10 bg-white px-4 py-3 dark:bg-gray-900">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ inspector.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ inspector.plannerName }}
                    </p>
                  </div>
                </td>
                <td
                  v-for="day in report.period.weekDays"
                  :key="day"
                  class="whitespace-nowrap px-3 py-3 text-center text-sm"
                  :class="inspector.daily[day] >= inspector.dailyTarget && inspector.dailyTarget > 0
                    ? 'bg-green-50 font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ inspector.daily[day] > 0 ? formatCurrency(inspector.daily[day]) : '-' }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(inspector.weeklyTotal) }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ formatCurrency(inspector.weeklyTarget) }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="getPerformanceBg(inspector.performance) + ' ' + getPerformanceColor(inspector.performance)"
                  >
                    {{ inspector.performance }}%
                  </span>
                </td>
              </tr>

              <!-- Totals Row -->
              <tr class="bg-gray-50 font-semibold dark:bg-gray-800">
                <td class="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-white">
                  TOTAL
                </td>
                <td
                  v-for="day in report.period.weekDays"
                  :key="day"
                  class="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(report.dailyTotals[day]) }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(report.summary.totalTurnover) }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(report.summary.totalTarget) }}
                </td>
                <td class="whitespace-nowrap px-3 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="getPerformanceBg(report.summary.performance) + ' ' + getPerformanceColor(report.summary.performance)"
                  >
                    {{ report.summary.performance }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Generated timestamp -->
      <p class="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        Generated: {{ new Date(report.generatedAt).toLocaleString() }}
      </p>
    </template>
  </div>
</template>
