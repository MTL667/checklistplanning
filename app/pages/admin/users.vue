<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch users
const { data: users, refresh, status } = await useFetch('/api/users')

// Edit user modal
const showEditModal = ref(false)
const editingUser = ref<any>(null)
const newRole = ref<'ADMIN' | 'PLANNER'>('PLANNER')
const isSubmitting = ref(false)

function openEdit(user: any) {
  editingUser.value = user
  newRole.value = user.role
  showEditModal.value = true
}

async function handleSave() {
  if (!editingUser.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await $fetch(`/api/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: { role: newRole.value }
    })

    toast.add({
      title: 'Success',
      description: 'Role updated',
      color: 'success'
    })

    showEditModal.value = false
    await refresh()
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
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('planner.title') }}
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        {{ users?.length || 0 }} {{ t('planner.title').toLowerCase() }}
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="status === 'pending'" class="py-8 text-center text-gray-500">
      Loading...
    </div>

    <!-- Users Table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.name') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.status') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('planner.inspectorCount') }}
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="whitespace-nowrap px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                    <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {{ user.name?.charAt(0)?.toUpperCase() || '?' }}
                    </span>
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">{{ user.name }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                {{ user.email }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-1 text-xs font-medium"
                  :class="user.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'"
                >
                  {{ t(`roles.${user.role.toLowerCase()}`) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                {{ user.inspectorCount || 0 }} {{ t('nav.inspectors').toLowerCase() }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-edit"
                  variant="ghost"
                  size="sm"
                  @click="openEdit(user)"
                />
              </td>
            </tr>
            <tr v-if="!users?.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('common.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Edit Role Modal -->
    <UModal v-model:open="showEditModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('common.edit') }}: {{ editingUser?.name }}
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
                {{ t('common.status') }}
              </label>
              <select
                v-model="newRole"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="PLANNER">{{ t('roles.planner') }}</option>
                <option value="ADMIN">{{ t('roles.admin') }}</option>
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
