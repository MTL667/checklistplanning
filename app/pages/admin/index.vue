<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t, locale } = useI18n()

// Fetch dashboard data with auto-refresh
const { data: overview, refresh: refreshOverview } = await useFetch('/api/admin/overview', {
  server: false
})

const { data: plannersStatus } = await useFetch('/api/admin/planners-status', {
  server: false
})

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout
onMounted(() => {
  refreshInterval = setInterval(() => {
    refreshOverview()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
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

// Format time ago
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h2>
        <ClientOnly>
          <p class="text-gray-500 dark:text-gray-400">
            {{ new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }) }}
          </p>
        </ClientOnly>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        @click="refreshOverview"
      />
    </div>

    <!-- Stats Grid -->
    <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Users -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <UIcon name="i-lucide-users" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalPlanners') }}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ overview?.users?.planners || 0 }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Inspectors -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <UIcon name="i-lucide-user-check" class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalInspectors') }}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ overview?.inspectors?.total || 0 }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Today's Turnover -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <UIcon name="i-lucide-euro" class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.todayTurnover') }}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(overview?.turnover?.today || 0) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Active Absences -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="{
            'bg-red-100 dark:bg-red-900': (overview?.absences?.active || 0) > 0,
            'bg-gray-100 dark:bg-gray-800': (overview?.absences?.active || 0) === 0
          }">
            <UIcon
              name="i-lucide-calendar-off"
              class="h-6 w-6"
              :class="{
                'text-red-600 dark:text-red-400': (overview?.absences?.active || 0) > 0,
                'text-gray-600 dark:text-gray-400': (overview?.absences?.active || 0) === 0
              }"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('nav.absences') }}</p>
            <p class="text-2xl font-semibold" :class="{
              'text-red-600 dark:text-red-400': (overview?.absences?.active || 0) > 0,
              'text-gray-900 dark:text-white': (overview?.absences?.active || 0) === 0
            }">
              {{ overview?.absences?.active || 0 }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Planner Status -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ t('planner.title') }} Status
            </h3>
            <NuxtLink to="/admin/users" class="text-sm text-primary-600 hover:underline dark:text-primary-400">
              View all →
            </NuxtLink>
          </div>
        </template>

        <div class="space-y-4">
          <div
            v-for="planner in plannersStatus"
            :key="planner.id"
            class="flex items-center gap-4 rounded-lg p-3"
            :class="{
              'bg-red-50 dark:bg-red-900/20': planner.isAbsent,
              'hover:bg-gray-50 dark:hover:bg-gray-800': !planner.isAbsent
            }"
          >
            <UAvatar :alt="planner.name" size="sm" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ planner.name }}
                </p>
                <UBadge v-if="planner.isAbsent" color="red" variant="soft" size="xs">
                  Absent
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ planner.inspectorCount }} inspectors • {{ formatCurrency(planner.todayTurnover) }}
              </p>
            </div>
            <div class="text-right">
              <div class="flex items-center gap-2">
                <div class="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="{
                      'bg-green-500': planner.checklistProgress.percentage === 100,
                      'bg-yellow-500': planner.checklistProgress.percentage >= 50 && planner.checklistProgress.percentage < 100,
                      'bg-red-500': planner.checklistProgress.percentage < 50
                    }"
                    :style="{ width: `${planner.checklistProgress.percentage}%` }"
                  />
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ planner.checklistProgress.percentage }}%
                </span>
              </div>
            </div>
          </div>

          <div v-if="!plannersStatus?.length" class="py-4 text-center text-gray-500 dark:text-gray-400">
            No planners yet
          </div>
        </div>
      </UCard>

      <!-- Recent Activity -->
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </template>

        <div class="space-y-3">
          <div
            v-for="activity in overview?.recentActivity"
            :key="activity.id"
            class="flex items-center gap-3"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <UIcon name="i-lucide-euro" class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">
                <span class="font-medium">{{ activity.plannerName }}</span>
                entered {{ formatCurrency(activity.amount) }} for
                <span class="font-medium">{{ activity.inspectorName }}</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ timeAgo(activity.updatedAt) }}
              </p>
            </div>
          </div>

          <div v-if="!overview?.recentActivity?.length" class="py-4 text-center text-gray-500 dark:text-gray-400">
            No recent activity
          </div>
        </div>
      </UCard>
    </div>

    <!-- Active Absences Alert -->
    <UCard v-if="overview?.absences?.list?.length" class="mt-6 border-red-200 dark:border-red-800">
      <template #header>
        <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5" />
          <h3 class="font-semibold">Active Absences</h3>
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="absence in overview.absences.list"
          :key="absence.id"
          class="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ absence.plannerName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ absence.startDate }} - {{ absence.endDate }}
              <span v-if="absence.reason" class="text-gray-400">• {{ absence.reason }}</span>
            </p>
          </div>
          <UButton
            label="Manage"
            size="sm"
            variant="outline"
            color="red"
            to="/admin/absences"
          />
        </div>
      </div>
    </UCard>

    <!-- Quick Actions -->
    <div class="mt-6">
      <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('common.actions') }}
      </h3>
      <div class="flex flex-wrap gap-4">
        <UButton
          :label="t('nav.planners')"
          icon="i-lucide-users"
          to="/admin/users"
        />
        <UButton
          :label="t('nav.inspectors')"
          icon="i-lucide-user-check"
          variant="outline"
          to="/admin/inspectors"
        />
        <UButton
          :label="t('nav.targets')"
          icon="i-lucide-target"
          variant="outline"
          to="/admin/targets"
        />
        <UButton
          :label="t('nav.tasks')"
          icon="i-lucide-list-checks"
          variant="outline"
          to="/admin/tasks"
        />
        <UButton
          :label="t('nav.absences')"
          icon="i-lucide-calendar-off"
          variant="outline"
          to="/admin/absences"
        />
      </div>
    </div>
  </div>
</template>
