<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t, locale } = useI18n()
const toast = useToast()

// Fetch tasks
const { data: tasks, refresh } = await useFetch('/api/checklist/tasks')

// Create task modal
const isCreating = ref(false)
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
  }
}

// Edit task modal
const isEditing = ref(false)
const editingTask = ref<any>(null)

function openEditModal(task: any) {
  editingTask.value = { ...task }
  isEditing.value = true
}

async function saveTask() {
  if (!editingTask.value) return

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

const frequencyOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' }
]
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
                color="gray"
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
    <UModal v-model="isCreating">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Create Task</h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isCreating = false" />
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Name (Dutch)">
              <UInput v-model="newTask.nameNl" placeholder="Task name in Dutch" />
            </UFormGroup>
            <UFormGroup label="Name (French)">
              <UInput v-model="newTask.nameFr" placeholder="Task name in French" />
            </UFormGroup>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Description (Dutch)">
              <UTextarea v-model="newTask.descriptionNl" placeholder="Optional description" rows="2" />
            </UFormGroup>
            <UFormGroup label="Description (French)">
              <UTextarea v-model="newTask.descriptionFr" placeholder="Optional description" rows="2" />
            </UFormGroup>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Frequency">
              <USelect v-model="newTask.frequency" :options="frequencyOptions" option-attribute="label" value-attribute="value" />
            </UFormGroup>
            <UFormGroup label="Sort Order">
              <UInput v-model.number="newTask.sortOrder" type="number" min="0" />
            </UFormGroup>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isCreating = false" />
            <UButton
              :label="t('common.create')"
              :disabled="!newTask.nameNl.trim() || !newTask.nameFr.trim()"
              @click="createTask"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Task Modal -->
    <UModal v-model="isEditing">
      <UCard v-if="editingTask">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Edit Task</h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isEditing = false" />
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Name (Dutch)">
              <UInput v-model="editingTask.nameNl" />
            </UFormGroup>
            <UFormGroup label="Name (French)">
              <UInput v-model="editingTask.nameFr" />
            </UFormGroup>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Description (Dutch)">
              <UTextarea v-model="editingTask.descriptionNl" rows="2" />
            </UFormGroup>
            <UFormGroup label="Description (French)">
              <UTextarea v-model="editingTask.descriptionFr" rows="2" />
            </UFormGroup>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormGroup label="Frequency">
              <USelect v-model="editingTask.frequency" :options="frequencyOptions" option-attribute="label" value-attribute="value" />
            </UFormGroup>
            <UFormGroup label="Sort Order">
              <UInput v-model.number="editingTask.sortOrder" type="number" min="0" />
            </UFormGroup>
          </div>

          <UFormGroup>
            <UCheckbox v-model="editingTask.isActive" label="Active" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isEditing = false" />
            <UButton :label="t('common.save')" @click="saveTask" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
