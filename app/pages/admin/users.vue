<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin']
})

const { t } = useI18n()
const toast = useToast()

// Fetch users
const { data: users, refresh } = await useFetch('/api/users')

// Table columns
const columns = [
  { key: 'name', label: t('common.name') },
  { key: 'email', label: 'Email' },
  { key: 'role', label: t('common.status') },
  { key: 'inspectorCount', label: t('planner.inspectorCount') },
  { key: 'actions', label: t('common.actions') }
]

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
      <UTable :columns="columns" :rows="users || []">
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar :alt="row.name" size="sm" />
            <span class="font-medium">{{ row.name }}</span>
          </div>
        </template>

        <template #role-data="{ row }">
          <UBadge
            :color="row.role === 'ADMIN' ? 'purple' : 'blue'"
            variant="soft"
          >
            {{ t(`roles.${row.role.toLowerCase()}`) }}
          </UBadge>
        </template>

        <template #inspectorCount-data="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ row.inspectorCount }} {{ t('nav.inspectors').toLowerCase() }}
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
