<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch inspectors with targets
const { data: inspectors, refresh } = await useFetch('/api/inspectors')

// Edit target modal
const isEditing = ref(false)
const editingInspector = ref<any>(null)
const newTarget = ref(0)

function openEditModal(inspector: any) {
  editingInspector.value = inspector
  newTarget.value = inspector.defaultTarget || 0
  isEditing.value = true
}

async function saveTarget() {
  if (!editingInspector.value) return

  try {
    await $fetch('/api/turnover/targets', {
      method: 'POST',
      body: {
        inspectorId: editingInspector.value.id,
        amount: newTarget.value,
        isDefault: true
      }
    })

    toast.add({
      title: t('common.save'),
      description: 'Target updated successfully',
      color: 'success'
    })

    isEditing.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update target',
      color: 'error'
    })
  }
}

// Bulk update targets
const isBulkEditing = ref(false)
const bulkTarget = ref(0)
const selectedInspectors = ref<string[]>([])

async function bulkUpdateTargets() {
  if (selectedInspectors.value.length === 0) return

  try {
    // Update each selected inspector
    await Promise.all(
      selectedInspectors.value.map(inspectorId =>
        $fetch('/api/turnover/targets', {
          method: 'POST',
          body: {
            inspectorId,
            amount: bulkTarget.value,
            isDefault: true
          }
        })
      )
    )

    toast.add({
      title: t('common.save'),
      description: `${selectedInspectors.value.length} targets updated`,
      color: 'success'
    })

    isBulkEditing.value = false
    selectedInspectors.value = []
    bulkTarget.value = 0
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update targets',
      color: 'error'
    })
  }
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

// Table columns
const columns = [
  { key: 'name', label: t('inspector.name') },
  { key: 'plannerName', label: t('inspector.assignedTo') },
  { key: 'defaultTarget', label: t('target.daily') },
  { key: 'weeklyTarget', label: t('target.weekly') },
  { key: 'actions', label: t('common.actions') }
]

// Add computed targets
const inspectorsWithTargets = computed(() => {
  return (inspectors.value || []).map(inspector => ({
    ...inspector,
    defaultTarget: (inspector as any).defaultTarget || 0,
    weeklyTarget: ((inspector as any).defaultTarget || 0) * 5
  }))
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.targets') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Set daily turnover targets for inspectors
        </p>
      </div>
      <UButton
        v-if="selectedInspectors.length > 0"
        :label="`Bulk Edit (${selectedInspectors.length})`"
        icon="i-lucide-edit"
        @click="isBulkEditing = true"
      />
    </div>

    <!-- Targets Table -->
    <UCard>
      <UTable
        v-model="selectedInspectors"
        :columns="columns"
        :rows="inspectorsWithTargets"
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

        <template #defaultTarget-data="{ row }">
          <span class="font-semibold" :class="{
            'text-green-600 dark:text-green-400': row.defaultTarget > 0,
            'text-gray-400': row.defaultTarget === 0
          }">
            {{ formatCurrency(row.defaultTarget) }}
          </span>
        </template>

        <template #weeklyTarget-data="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ formatCurrency(row.weeklyTarget) }}
          </span>
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

    <!-- Edit Target Modal -->
    <UModal v-model="isEditing">
      <UCard v-if="editingInspector">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Set Target: {{ editingInspector.name }}
            </h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isEditing = false" />
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup :label="t('target.daily')">
            <UInput
              v-model.number="newTarget"
              type="number"
              min="0"
              step="1"
            >
              <template #leading>
                <span class="text-gray-400">€</span>
              </template>
            </UInput>
          </UFormGroup>

          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('target.weekly') }}:
              <span class="font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(newTarget * 5) }}
              </span>
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isEditing = false" />
            <UButton :label="t('common.save')" @click="saveTarget" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Bulk Edit Modal -->
    <UModal v-model="isBulkEditing">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Bulk Edit Targets ({{ selectedInspectors.length }} inspectors)
            </h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isBulkEditing = false" />
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-500 dark:text-gray-400">
            Set the same daily target for all selected inspectors.
          </p>

          <UFormGroup :label="t('target.daily')">
            <UInput
              v-model.number="bulkTarget"
              type="number"
              min="0"
              step="1"
            >
              <template #leading>
                <span class="text-gray-400">€</span>
              </template>
            </UInput>
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isBulkEditing = false" />
            <UButton :label="t('common.save')" @click="bulkUpdateTargets" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
