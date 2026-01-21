<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch data
const { data: absences, refresh: refreshAbsences } = await useFetch('/api/absences', {
  server: false
})
const { data: users } = await useFetch('/api/users', {
  server: false
})

const planners = computed(() =>
  (users.value || []).filter(u => u.role === 'PLANNER' || u.role === 'ADMIN')
)

// Create absence modal
const isCreating = ref(false)
const isCreatingAbsence = ref(false)
const newAbsence = ref({
  plannerId: '',
  startDate: '',
  endDate: '',
  reason: ''
})

async function createAbsence() {
  if (!newAbsence.value.plannerId || !newAbsence.value.startDate || !newAbsence.value.endDate) return

  isCreatingAbsence.value = true
  try {
    await $fetch('/api/absences', {
      method: 'POST',
      body: newAbsence.value
    })

    toast.add({
      title: t('common.create'),
      description: 'Absence recorded successfully',
      color: 'success'
    })

    isCreating.value = false
    newAbsence.value = { plannerId: '', startDate: '', endDate: '', reason: '' }
    await refreshAbsences()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to create absence',
      color: 'error'
    })
  } finally {
    isCreatingAbsence.value = false
  }
}

// Reassign modal
const isReassigning = ref(false)
const isSavingReassignments = ref(false)
const selectedAbsence = ref<any>(null)
const reassignments = ref<Record<string, string>>({})

function openReassignModal(absence: any) {
  selectedAbsence.value = absence
  // Initialize with existing reassignments
  reassignments.value = {}
  absence.reassignments?.forEach((r: any) => {
    reassignments.value[r.inspectorId] = r.temporaryPlannerId
  })
  isReassigning.value = true
}

async function saveReassignments() {
  if (!selectedAbsence.value) return

  isSavingReassignments.value = true
  try {
    // Save all reassignments
    const promises = Object.entries(reassignments.value)
      .filter(([_, plannerId]) => plannerId)
      .map(([inspectorId, temporaryPlannerId]) =>
        $fetch('/api/absences/reassign', {
          method: 'POST',
          body: {
            absenceId: selectedAbsence.value.id,
            inspectorId,
            temporaryPlannerId
          }
        })
      )

    await Promise.all(promises)

    toast.add({
      title: t('common.save'),
      description: 'Reassignments saved successfully',
      color: 'success'
    })

    isReassigning.value = false
    await refreshAbsences()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to save reassignments',
      color: 'error'
    })
  } finally {
    isSavingReassignments.value = false
  }
}

// Delete absence
async function deleteAbsence(id: string) {
  if (!confirm('Are you sure you want to delete this absence record?')) return

  try {
    await $fetch(`/api/absences/${id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: t('common.delete'),
      description: 'Absence deleted successfully',
      color: 'success'
    })

    await refreshAbsences()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to delete absence',
      color: 'error'
    })
  }
}

// Available planners for reassignment (excluding absent planner)
const availablePlanners = computed(() => {
  if (!selectedAbsence.value) return planners.value
  return planners.value.filter(p => p.id !== selectedAbsence.value.plannerId)
})

// Separate active and past absences
const activeAbsences = computed(() =>
  (absences.value || []).filter(a => a.isActive)
)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.absences') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          Manage planner absences and inspector reassignments
        </p>
      </div>
      <UButton
        :label="t('common.add')"
        icon="i-lucide-plus"
        @click="isCreating = true"
      />
    </div>

    <!-- Active Absences -->
    <div v-if="activeAbsences.length > 0" class="mb-8">
      <h3 class="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">
        Active Absences ({{ activeAbsences.length }})
      </h3>
      <div class="space-y-4">
        <UCard
          v-for="absence in activeAbsences"
          :key="absence.id"
          class="border-red-200 dark:border-red-800"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">
                  {{ absence.plannerName }}
                </h4>
                <UBadge color="red" variant="soft">Active</UBadge>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ absence.startDate }} - {{ absence.endDate }}
                <span v-if="absence.reason">• {{ absence.reason }}</span>
              </p>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {{ absence.inspectors?.length || 0 }} inspectors need reassignment
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Reassign"
                icon="i-lucide-users"
                size="sm"
                @click="openReassignModal(absence)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="red"
                size="sm"
                @click="deleteAbsence(absence.id)"
              />
            </div>
          </div>

          <!-- Reassignment Status -->
          <div v-if="absence.reassignments?.length" class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Reassignments:
            </p>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="r in absence.reassignments"
                :key="r.id"
                color="green"
                variant="soft"
              >
                {{ r.inspectorName }} → {{ r.temporaryPlannerName }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- All Absences -->
    <div>
      <h3 class="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
        All Absences
      </h3>
      <UCard>
        <div class="space-y-3">
          <div
            v-for="absence in absences"
            :key="absence.id"
            class="flex items-center justify-between rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ absence.plannerName }}
                </span>
                <UBadge
                  :color="absence.isActive ? 'red' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  {{ absence.isActive ? 'Active' : 'Past' }}
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ absence.startDate }} - {{ absence.endDate }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                v-if="absence.isActive"
                icon="i-lucide-users"
                variant="ghost"
                size="sm"
                @click="openReassignModal(absence)"
              />
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                color="red"
                size="sm"
                @click="deleteAbsence(absence.id)"
              />
            </div>
          </div>

          <div v-if="!absences?.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
            No absence records
          </div>
        </div>
      </UCard>
    </div>

    <!-- Create Absence Modal -->
    <UModal v-model:open="isCreating">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Record Absence</h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isCreating = false" />
          </div>
        </template>

        <template #content>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Planner</label>
              <select
                v-model="newAbsence.plannerId"
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select planner...</option>
                <option v-for="planner in planners" :key="planner.id" :value="planner.id">
                  {{ planner.name }}
                </option>
              </select>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                <input
                  v-model="newAbsence.startDate"
                  type="date"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <input
                  v-model="newAbsence.endDate"
                  type="date"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason (optional)</label>
              <input
                v-model="newAbsence.reason"
                type="text"
                placeholder="Sick leave, vacation, etc."
                class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isCreating = false" />
            <UButton
              :label="t('common.create')"
              :disabled="!newAbsence.plannerId || !newAbsence.startDate || !newAbsence.endDate"
              :loading="isCreatingAbsence"
              @click="createAbsence"
            />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Reassign Modal -->
    <UModal v-model:open="isReassigning">
      <UCard v-if="selectedAbsence">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Reassign Inspectors: {{ selectedAbsence.plannerName }}
            </h3>
            <UButton icon="i-lucide-x" variant="ghost" size="sm" @click="isReassigning = false" />
          </div>
        </template>

        <template #content>
          <div class="space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Assign each inspector to a temporary planner during the absence period.
            </p>

            <div
              v-for="inspector in selectedAbsence.inspectors"
              :key="inspector.id"
              class="flex items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ inspector.name }}
                </p>
              </div>
              <div class="w-48">
                <select
                  v-model="reassignments[inspector.id]"
                  class="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select planner...</option>
                  <option v-for="planner in availablePlanners" :key="planner.id" :value="planner.id">
                    {{ planner.name }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="!selectedAbsence.inspectors?.length" class="py-4 text-center text-gray-500 dark:text-gray-400">
              No inspectors to reassign
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isReassigning = false" />
            <UButton :label="t('common.save')" :loading="isSavingReassignments" @click="saveReassignments" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
