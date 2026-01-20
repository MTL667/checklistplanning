<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch users
const { data: users, refresh } = await useFetch('/api/users')


// Edit user modal
const isEditing = ref(false)
const editingUser = ref<any>(null)
const newRole = ref<'ADMIN' | 'PLANNER'>('PLANNER')

function openEditModal(user: any) {
  editingUser.value = user
  newRole.value = user.role
  isEditing.value = true
}

async function saveRole() {
  if (!editingUser.value) return

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
  }
}

const roleOptions = [
  { value: 'ADMIN', label: t('roles.admin') },
  { value: 'PLANNER', label: t('roles.planner') }
]
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
                {{ user.inspectorCount || 0 }} {{ t('nav.inspectors').toLowerCase() }}
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
    <UModal v-model="isEditing">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('common.edit') }} {{ editingUser?.name }}
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
          <UFormGroup :label="t('common.status')">
            <USelect
              v-model="newRole"
              :options="roleOptions"
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
              @click="saveRole"
            />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
