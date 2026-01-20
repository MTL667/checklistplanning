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

// Bulk assign
const selectedInspectors = ref<string[]>([])
const isBulkAssigning = ref(false)
const bulkPlannerId = ref<string | null>(null)

async function bulkAssign() {
  if (selectedInspectors.value.length === 0) return

  try {
    await $fetch('/api/inspectors/assign', {
      method: 'POST',
      body: {
        inspectorIds: selectedInspectors.value,
        plannerId: bulkPlannerId.value
      }
    })

    toast.add({
      title: t('inspector.bulkAssign'),
      description: `${selectedInspectors.value.length} inspectors assigned`,
      color: 'success'
    })

    isBulkAssigning.value = false
    selectedInspectors.value = []
    bulkPlannerId.value = null
    await refreshInspectors()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to assign inspectors',
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
      <div class="flex gap-3">
        <UButton
          v-if="selectedInspectors.length > 0"
          :label="`${t('inspector.bulkAssign')} (${selectedInspectors.length})`"
          variant="outline"
          @click="isBulkAssigning = true"
        />
        <UButton
          :label="t('common.add')"
          icon="i-lucide-plus"
          @click="isCreating = true"
        />
      </div>
    </div>

    <!-- Inspectors Table -->
    <UCard>
      <UTable
        v-model="selectedInspectors"
        :columns="columns"
        :rows="inspectors || []"
        :row-key="row => row.id"
      >
        <template #name-data="{ row }">
          <span class="font-medium">{{ row.name }}</span>
        </template>

        <template #plannerName-data="{ row }">
          <span v-if="row.plannerName" class="text-gray-600 dark:text-gray-400">
            {{ row.plannerName }}
          </span>
          <UBadge v-else color="orange" variant="soft">
            {{ t('inspector.unassigned') }}
          </UBadge>
        </template>

        <template #isActive-data="{ row }">
          <UBadge
            :color="row.isActive ? 'green' : 'gray'"
            variant="soft"
          >
            {{ row.isActive ? t('planner.active') : 'Inactive' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UButton
            icon="i-lucide-edit"
            variant="ghost"
            size="sm"
            @click="openEditModal(row)"
          />
        </template>
      </UTable>
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

    <!-- Bulk Assign Modal -->
    <UModal v-model="isBulkAssigning">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('inspector.bulkAssign') }}
            </h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="isBulkAssigning = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Assign {{ selectedInspectors.length }} inspector(s) to:
          </p>

          <UFormGroup :label="t('inspector.assignedTo')">
            <USelect
              v-model="bulkPlannerId"
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
              @click="isBulkAssigning = false"
            />
            <UButton
              :label="t('common.confirm')"
              @click="bulkAssign"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
