<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch data
const { data: inspectors, refresh: refreshInspectors } = await useFetch('/api/inspectors')
const { data: users } = await useFetch('/api/users')

// Get planners only
const planners = computed(() =>
  (users.value || []).filter(u => u.role === 'PLANNER' || u.role === 'ADMIN')
)

// Table columns
const columns = [
  { key: 'name', label: t('inspector.name') },
  { key: 'plannerName', label: t('inspector.assignedTo') },
  { key: 'isActive', label: t('common.status') },
  { key: 'actions', label: t('common.actions') }
]

// Create inspector modal
const isCreating = ref(false)
const newInspectorName = ref('')
const newInspectorPlanner = ref<string | null>(null)

async function createInspector() {
  if (!newInspectorName.value.trim()) return

  try {
    await $fetch('/api/inspectors', {
      method: 'POST',
      body: {
        name: newInspectorName.value,
        plannerId: newInspectorPlanner.value
      }
    })

    toast.add({
      title: t('common.create'),
      description: 'Inspector created successfully',
      color: 'success'
    })

    isCreating.value = false
    newInspectorName.value = ''
    newInspectorPlanner.value = null
    await refreshInspectors()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to create inspector',
      color: 'error'
    })
  }
}

// Edit inspector modal
const isEditing = ref(false)
const editingInspector = ref<any>(null)
const editPlannerId = ref<string | null>(null)

function openEditModal(inspector: any) {
  editingInspector.value = inspector
  editPlannerId.value = inspector.plannerId
  isEditing.value = true
}

async function saveInspector() {
  if (!editingInspector.value) return

  try {
    await $fetch(`/api/inspectors/${editingInspector.value.id}`, {
      method: 'PATCH',
      body: { plannerId: editPlannerId.value }
    })

    toast.add({
      title: t('common.save'),
      description: 'Inspector updated successfully',
      color: 'success'
    })

    isEditing.value = false
    await refreshInspectors()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update inspector',
      color: 'error'
    })
  }
}


const plannerOptions = computed(() => [
  { value: null, label: t('inspector.unassigned') },
  ...planners.value.map(p => ({ value: p.id, label: p.name }))
])
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
        :label="t('common.add')"
        icon="i-lucide-plus"
        @click="isCreating = true"
      />
    </div>

    <!-- Inspectors Table -->
    <UCard>
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
                <UBadge v-else color="orange" variant="soft">
                  {{ t('inspector.unassigned') }}
                </UBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <UBadge :color="inspector.isActive ? 'green' : 'neutral'" variant="soft">
                  {{ inspector.isActive ? t('planner.active') : 'Inactive' }}
                </UBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-edit"
                  variant="ghost"
                  size="sm"
                  @click="openEditModal(inspector)"
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

    <!-- Create Inspector Modal -->
    <UModal v-model="isCreating">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('common.add') }} {{ t('nav.inspectors').toLowerCase() }}
            </h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="isCreating = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup :label="t('inspector.name')">
            <UInput v-model="newInspectorName" :placeholder="t('inspector.name')" />
          </UFormGroup>

          <UFormGroup :label="t('inspector.assignedTo')">
            <USelect
              v-model="newInspectorPlanner"
              :options="plannerOptions"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              :label="t('common.cancel')"
              variant="ghost"
              @click="isCreating = false"
            />
            <UButton
              :label="t('common.create')"
              :disabled="!newInspectorName.trim()"
              @click="createInspector"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Edit Inspector Modal -->
    <UModal v-model="isEditing">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('inspector.reassign') }}: {{ editingInspector?.name }}
            </h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="isEditing = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup :label="t('inspector.assignedTo')">
            <USelect
              v-model="editPlannerId"
              :options="plannerOptions"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              :label="t('common.cancel')"
              variant="ghost"
              @click="isEditing = false"
            />
            <UButton
              :label="t('common.save')"
              @click="saveInspector"
            />
          </div>
        </template>
      </UCard>
    </UModal>

  </div>
</template>
