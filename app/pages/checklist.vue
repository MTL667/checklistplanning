<script setup lang="ts">
definePageMeta({
  layout: 'planner',
  middleware: 'auth'
})

const { t, locale } = useI18n()
const toast = useToast()

// Current date
const currentDate = ref(new Date())

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Date navigation
function previousDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 1)
  currentDate.value = newDate
}

function nextDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 1)
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

const dateLabel = computed(() => {
  return currentDate.value.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const isToday = computed(() => {
  const today = new Date()
  return formatDate(currentDate.value) === formatDate(today)
})

// Fetch checklist entries
const dateStr = computed(() => formatDate(currentDate.value))

const { data: tasks, refresh } = await useFetch('/api/checklist/entries', {
  query: computed(() => ({ date: dateStr.value })),
  watch: [dateStr]
})

// Calculate progress
const progress = computed(() => {
  if (!tasks.value || tasks.value.length === 0) return 0
  const completed = tasks.value.filter(t => t.completed).length
  return Math.round((completed / tasks.value.length) * 100)
})

const completedCount = computed(() => {
  return tasks.value?.filter(t => t.completed).length || 0
})

// Toggle task
const togglingTasks = ref<Record<string, boolean>>({})

async function toggleTask(taskId: string, currentState: boolean) {
  togglingTasks.value[taskId] = true

  try {
    await $fetch('/api/checklist/entries', {
      method: 'POST',
      body: {
        taskTypeId: taskId,
        date: dateStr.value,
        completed: !currentState
      }
    })

    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update',
      color: 'error'
    })
  } finally {
    togglingTasks.value[taskId] = false
  }
}

// Get localized task name
function getTaskName(task: any): string {
  return locale.value === 'fr' ? task.nameFr : task.nameNl
}

function getTaskDescription(task: any): string | null {
  return locale.value === 'fr' ? task.descriptionFr : task.descriptionNl
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('checklist.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ t('checklist.progress', { completed: completedCount, total: tasks?.length || 0 }) }}
        </p>
      </div>

      <!-- Date Navigation -->
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          variant="ghost"
          size="sm"
          @click="previousDay"
        />
        <UButton
          :label="dateLabel"
          :variant="isToday ? 'solid' : 'outline'"
          size="sm"
          @click="goToToday"
        />
        <UButton
          icon="i-lucide-chevron-right"
          variant="ghost"
          size="sm"
          @click="nextDay"
        />
      </div>
    </div>

    <!-- Progress Bar -->
    <UCard class="mb-6">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('checklist.progress', { completed: completedCount, total: tasks?.length || 0 }) }}
            </span>
            <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {{ progress }}%
            </span>
          </div>
          <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              class="h-full rounded-full bg-primary-500 transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>
        <div v-if="progress === 100" class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <UIcon name="i-lucide-check-circle" class="h-6 w-6" />
          <span class="font-medium">{{ t('checklist.allComplete') }}</span>
        </div>
      </div>
    </UCard>

    <!-- Task List -->
    <div v-if="tasks && tasks.length > 0" class="space-y-3">
      <UCard
        v-for="task in tasks"
        :key="task.id"
        class="transition-all duration-200"
        :class="{
          'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20': task.completed
        }"
      >
        <div class="flex items-start gap-4">
          <button
            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
            :class="task.completed
              ? 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 hover:border-primary-500 dark:border-gray-600'"
            :disabled="togglingTasks[task.id]"
            @click="toggleTask(task.id, task.completed)"
          >
            <UIcon
              v-if="task.completed"
              name="i-lucide-check"
              class="h-4 w-4"
            />
            <USpinner v-else-if="togglingTasks[task.id]" size="xs" />
          </button>

          <div class="flex-1">
            <h3
              class="font-medium transition-colors"
              :class="task.completed
                ? 'text-gray-500 line-through dark:text-gray-400'
                : 'text-gray-900 dark:text-white'"
            >
              {{ getTaskName(task) }}
            </h3>
            <p
              v-if="getTaskDescription(task)"
              class="mt-1 text-sm text-gray-500 dark:text-gray-400"
            >
              {{ getTaskDescription(task) }}
            </p>
            <p
              v-if="task.completedAt"
              class="mt-1 text-xs text-gray-400 dark:text-gray-500"
            >
              {{ t('checklist.completed') }} {{ new Date(task.completedAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'nl-NL', { hour: '2-digit', minute: '2-digit' }) }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <UCard v-else class="text-center">
      <div class="py-8">
        <UIcon name="i-lucide-list-checks" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {{ t('common.noData') }}
        </h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          No tasks have been configured yet.
        </p>
      </div>
    </UCard>
  </div>
</template>
