<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch data
const { data: inspectors, refresh: refreshInspectors, status } = await useFetch('/api/inspectors')
const { data: users } = await useFetch('/api/users')

// Get planners only
const planners = computed(() =>
  (users.value || []).filter((u: any) => u.role === 'PLANNER' || u.role === 'ADMIN')
)

// Create inspector
const showCreateModal = ref(false)
const newName = ref('')
const newPlannerId = ref('')
const isSubmitting = ref(false)

async function handleCreate() {
  if (!newName.value.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    await $fetch('/api/inspectors', {
      method: 'POST',
      body: {
        name: newName.value.trim(),
        plannerId: newPlannerId.value || null
      }
    })
    
    toast.add({
      title: 'Success',
      description: 'Inspector created',
      color: 'success'
    })
    
    showCreateModal.value = false
    newName.value = ''
    newPlannerId.value = ''
    await refreshInspectors()
  } catch (error: any) {
    console.error('Create error:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create inspector',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Edit inspector
const showEditModal = ref(false)
const editingId = ref('')
const editingName = ref('')
const editPlannerId = ref('')

function openEdit(inspector: any) {
  editingId.value = inspector.id
  editingName.value = inspector.name
  editPlannerId.value = inspector.plannerId || ''
  showEditModal.value = true
}

async function handleSave() {
  if (!editingId.value || isSubmitting.value) return
  
  isSubmitting.value = true
  try {
    await $fetch(`/api/inspectors/${editingId.value}`, {
      method: 'PATCH',
      body: { plannerId: editPlannerId.value || null }
    })
    
    toast.add({
      title: 'Success',
      description: 'Inspector updated',
      color: 'success'
    })
    
    showEditModal.value = false
    await refreshInspectors()
  } catch (error: any) {
    console.error('Save error:', error)
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('inspector.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ inspectors?.length || 0 }} {{ t('nav.inspectors').toLowerCase() }}
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        {{ t('common.add') }}
      </UButton>
    </div>

    <!-- Loading state -->
    <div v-if="status === 'pending'" class="py-8 text-center text-gray-500">
      Loading...
    </div>

    <!-- Inspectors Table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('inspector.name') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('inspector.assignedTo') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.status') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="inspector in inspectors" :key="inspector.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="whitespace-nowrap px-4 py-3">
                <span class="font-medium text-gray-900 dark:text-white">{{ inspector.name }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <span v-if="inspector.plannerName" class="text-gray-600 dark:text-gray-400">
                  {{ inspector.plannerName }}
                </span>
                <span v-else class="text-orange-500">
                  {{ t('inspector.unassigned') }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <span :class="inspector.isActive ? 'text-green-500' : 'text-gray-500'">
                  {{ inspector.isActive ? t('planner.active') : 'Inactive' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-edit"
                  variant="ghost"
                  size="sm"
                  @click="openEdit(inspector)"
                />
              </td>
            </tr>
            <tr v-if="!inspectors?.length">
              <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('common.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model:open="showCreateModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('common.add') }} Inspector
              </h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                size="sm"
                @click="showCreateModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('inspector.name') }}
              </label>
              <input
                v-model="newName"
                type="text"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                :placeholder="t('inspector.name')"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('inspector.assignedTo') }}
              </label>
              <select
                v-model="newPlannerId"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">{{ t('inspector.unassigned') }}</option>
                <option v-for="planner in planners" :key="planner.id" :value="planner.id">
                  {{ planner.name }}
                </option>
              </select>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                @click="showCreateModal = false"
              >
                {{ t('common.cancel') }}
              </UButton>
              <UButton
                :disabled="!newName.trim() || isSubmitting"
                :loading="isSubmitting"
                @click="handleCreate"
              >
                {{ t('common.create') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('common.edit') }}: {{ editingName }}
              </h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                size="sm"
                @click="showEditModal = false"
              />
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('inspector.assignedTo') }}
              </label>
              <select
                v-model="editPlannerId"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">{{ t('inspector.unassigned') }}</option>
                <option v-for="planner in planners" :key="planner.id" :value="planner.id">
                  {{ planner.name }}
                </option>
              </select>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                @click="showEditModal = false"
              >
                {{ t('common.cancel') }}
              </UButton>
              <UButton
                :disabled="isSubmitting"
                :loading="isSubmitting"
                @click="handleSave"
              >
                {{ t('common.save') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
