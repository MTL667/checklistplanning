<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch inspectors with targets
const { data: inspectors, refresh } = await useFetch('/api/inspectors', {
  server: false
})

// Edit target modal
const isEditing = ref(false)
const isSaving = ref(false)
const editingInspector = ref<any>(null)
const newTarget = ref(0)

function openEditModal(inspector: any) {
  editingInspector.value = inspector
  newTarget.value = inspector.defaultTarget || 0
  isEditing.value = true
}

async function saveTarget() {
  if (!editingInspector.value) return

  isSaving.value = true
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
  } finally {
    isSaving.value = false
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
    </div>

    <!-- Targets Table -->
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
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('target.daily') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('target.weekly') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="inspector in inspectorsWithTargets" :key="inspector.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
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
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <span class="font-semibold" :class="{
                  'text-green-600 dark:text-green-400': inspector.defaultTarget > 0,
                  'text-gray-400': inspector.defaultTarget === 0
                }">
                  {{ formatCurrency(inspector.defaultTarget) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                {{ formatCurrency(inspector.weeklyTarget) }}
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
            <tr v-if="!inspectorsWithTargets.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('common.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Edit Target Modal -->
    <UModal v-model:open="isEditing">
      <UCard v-if="editingInspector">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Set Target: {{ editingInspector.name }}
            </h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isEditing = false" />
          </div>
        </template>

        <template #content>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('target.daily') }}
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                <input
                  v-model.number="newTarget"
                  type="number"
                  min="0"
                  step="1"
                  class="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
              </div>
            </div>

            <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('target.weekly') }}:
                <span class="font-semibold text-gray-900 dark:text-white">
                  {{ formatCurrency(newTarget * 5) }}
                </span>
              </p>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isEditing = false" />
            <UButton :label="t('common.save')" :loading="isSaving" @click="saveTarget" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
