<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch users
const { data: users, refresh } = await useFetch('/api/users', {
  server: false
})

// Edit user modal
const isEditing = ref(false)
const editingUser = ref<any>(null)
const newRole = ref<'ADMIN' | 'PLANNER'>('PLANNER')
const isSavingRole = ref(false)

function openEditModal(user: any) {
  editingUser.value = user
  newRole.value = user.role
  isEditing.value = true
}

async function saveRole() {
  if (!editingUser.value) return

  isSavingRole.value = true
  try {
    await $fetch(`/api/users/${editingUser.value.id}`, {
      method: 'PATCH',
      body: { role: newRole.value }
    })

    toast.add({
      title: t('common.save'),
      description: 'Role updated successfully',
      color: 'success'
    })

    isEditing.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: t('errors.generic'),
      description: error.data?.message || 'Failed to update role',
      color: 'error'
    })
  } finally {
    isSavingRole.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('planner.title') }}
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ users?.length || 0 }} {{ t('planner.title').toLowerCase() }}
        </p>
      </div>
    </div>

    <!-- Users Table -->
    <UCard>
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
                  <UAvatar :alt="user.name" size="sm" />
                  <span class="font-medium text-gray-900 dark:text-white">{{ user.name }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                {{ user.email }}
              </td>
              <td class="whitespace-nowrap px-4 py-3">
                <UBadge
                  :color="user.role === 'ADMIN' ? 'purple' : 'blue'"
                  variant="soft"
                >
                  {{ t(`roles.${user.role.toLowerCase()}`) }}
                </UBadge>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                {{ user.inspectorCount }} {{ t('nav.inspectors').toLowerCase() }}
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right">
                <UButton
                  icon="i-lucide-edit"
                  variant="ghost"
                  size="sm"
                  @click="openEditModal(user)"
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
    <Teleport to="body">
      <div v-if="isEditing && editingUser" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="isEditing = false" />
        <div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('common.edit') }} {{ editingUser?.name }}
            </h3>
            <button class="text-gray-400 hover:text-gray-600" @click="isEditing = false">
              <span class="i-lucide-x h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('common.status') }}</label>
              <select
                v-model="newRole"
                class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="ADMIN">{{ t('roles.admin') }}</option>
                <option value="PLANNER">{{ t('roles.planner') }}</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <UButton :label="t('common.cancel')" variant="ghost" @click="isEditing = false" />
            <UButton :label="t('common.save')" :loading="isSavingRole" @click="saveRole" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
