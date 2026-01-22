<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t, locale } = useI18n()
const toast = useToast()

// Fetch tasks
const { data: tasks, refresh } = await useFetch('/api/checklist/tasks', {
  server: false
})

// Create task modal
const isCreating = ref(false)
const isCreatingTask = ref(false)
const newTask = ref({
  nameNl: '',
  nameFr: '',
  descriptionNl: '',
  descriptionFr: '',
  frequency: 'DAILY' as 'DAILY' | 'WEEKLY',
  sortOrder: 0
})

async function createTask() {
  if (!newTask.value.nameNl.trim() || !newTask.value.nameFr.trim()) return

  isCreatingTask.value = true
  try {
    await $fetch('/api/checklist/tasks', {
      method: 'POST',
      body: newTask.value
    })

    toast.add({
      title: t('common.create'),
      description: 'Task created successfully',
      color: 'success'
    })

    isCreating.value = false
    newTask.value = {
      nameNl: '',
      nameFr: '',
      descriptionNl: '',
      descriptionFr: '',
      frequency: 'DAILY',
      sortOrder: 0
    }
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to create task',
      color: 'error'
    })
  } finally {
    isCreatingTask.value = false
  }
}

// Edit task modal
const isEditing = ref(false)
const isSavingTask = ref(false)
const editingTask = ref<any>(null)

function openEditModal(task: any) {
  editingTask.value = { ...task }
  isEditing.value = true
}

async function saveTask() {
  if (!editingTask.value) return

  isSavingTask.value = true
  try {
    await $fetch(`/api/checklist/tasks/${editingTask.value.id}`, {
      method: 'PATCH',
      body: {
        nameNl: editingTask.value.nameNl,
        nameFr: editingTask.value.nameFr,
        descriptionNl: editingTask.value.descriptionNl,
        descriptionFr: editingTask.value.descriptionFr,
        frequency: editingTask.value.frequency,
        sortOrder: editingTask.value.sortOrder,
        isActive: editingTask.value.isActive
      }
    })

    toast.add({
      title: t('common.save'),
      description: 'Task updated successfully',
      color: 'success'
    })

    isEditing.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update task',
      color: 'error'
    })
  } finally {
    isSavingTask.value = false
  }
}

// Toggle task active status
async function toggleActive(task: any) {
  try {
    await $fetch(`/api/checklist/tasks/${task.id}`, {
      method: 'PATCH',
      body: { isActive: !task.isActive }
    })
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update task',
      color: 'error'
    })
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.tasks') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ tasks?.length || 0 }} checklist tasks
        </p>
      </div>
      <UButton
        :label="t('common.add')"
        icon="i-lucide-plus"
        @click="isCreating = true"
      />
    </div>

    <!-- Tasks List -->
    <div class="space-y-3">
      <UCard
        v-for="task in tasks"
        :key="task.id"
        :class="{ 'opacity-50': !task.isActive }"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ locale === 'fr' ? task.nameFr : task.nameNl }}
              </h3>
              <UBadge
                :color="task.frequency === 'DAILY' ? 'blue' : 'purple'"
                variant="soft"
                size="xs"
              >
                {{ task.frequency }}
              </UBadge>
              <UBadge
                v-if="!task.isActive"
                color="neutral"
                variant="soft"
                size="xs"
              >
                Inactive
              </UBadge>
            </div>
            <p v-if="task.descriptionNl || task.descriptionFr" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ locale === 'fr' ? task.descriptionFr : task.descriptionNl }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Order: {{ task.sortOrder }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-edit"
              variant="ghost"
              size="sm"
              @click="openEditModal(task)"
            />
            <UButton
              :icon="task.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              variant="ghost"
              size="sm"
              @click="toggleActive(task)"
            />
          </div>
        </div>
      </UCard>

      <UCard v-if="!tasks?.length" class="text-center">
        <div class="py-8">
          <UIcon name="i-lucide-list-checks" class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No tasks yet
          </h3>
          <p class="mt-2 text-gray-500 dark:text-gray-400">
            Create your first checklist task.
          </p>
          <UButton
            class="mt-4"
            :label="t('common.add')"
            icon="i-lucide-plus"
            @click="isCreating = true"
          />
        </div>
      </UCard>
    </div>

    <!-- Create Task Modal -->
    <Teleport to="body">
      <div v-if="isCreating" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="isCreating = false" />
        <div class="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Create Task</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="isCreating = false">
              <span class="i-lucide-x h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name (Dutch)</label>
                <input
                  v-model="newTask.nameNl"
                  type="text"
                  placeholder="Task name in Dutch"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name (French)</label>
                <input
                  v-model="newTask.nameFr"
                  type="text"
                  placeholder="Task name in French"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Dutch)</label>
                <textarea
                  v-model="newTask.descriptionNl"
                  rows="2"
                  placeholder="Optional description"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (French)</label>
                <textarea
                  v-model="newTask.descriptionFr"
                  rows="2"
                  placeholder="Optional description"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                <select
                  v-model="newTask.frequency"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
                <input
                  v-model.number="newTask.sortOrder"
                  type="number"
                  min="0"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isCreating = false" />
            <UButton
              :label="t('common.create')"
              :disabled="!newTask.nameNl.trim() || !newTask.nameFr.trim()"
              :loading="isCreatingTask"
              @click="createTask"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Edit Task Modal -->
    <Teleport to="body">
      <div v-if="isEditing && editingTask" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="isEditing = false" />
        <div class="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h3>
            <button class="text-gray-400 hover:text-gray-600" @click="isEditing = false">
              <span class="i-lucide-x h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name (Dutch)</label>
                <input
                  v-model="editingTask.nameNl"
                  type="text"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Name (French)</label>
                <input
                  v-model="editingTask.nameFr"
                  type="text"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Dutch)</label>
                <textarea
                  v-model="editingTask.descriptionNl"
                  rows="2"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Description (French)</label>
                <textarea
                  v-model="editingTask.descriptionFr"
                  rows="2"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                <select
                  v-model="editingTask.frequency"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
                <input
                  v-model.number="editingTask.sortOrder"
                  type="number"
                  min="0"
                  class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                id="isActive"
                v-model="editingTask.isActive"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              >
              <label for="isActive" class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isEditing = false" />
            <UButton :label="t('common.save')" :loading="isSavingTask" @click="saveTask" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
