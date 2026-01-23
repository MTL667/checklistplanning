<script setup lang="ts">
const { user, fetch: refreshSession } = useUserSession()

// Check both flags - originalUserId is the most reliable indicator
const isImpersonating = computed(() => !!user.value?.originalUserId || user.value?.isImpersonating === true)
const originalUserName = computed(() => user.value?.originalUserName || 'Admin')
const impersonatedUserName = computed(() => user.value?.name || '')

const isStoppingImpersonation = ref(false)

async function stopImpersonating() {
  isStoppingImpersonation.value = true
  try {
    await $fetch('/api/admin/stop-impersonate', {
      method: 'POST'
    })
    // Force full page reload to clear all cached session state
    window.location.href = '/admin'
  } catch (error: any) {
    console.error('Failed to stop impersonating:', error)
    // Show error to user
    alert(error.data?.message || 'Failed to stop impersonation')
    isStoppingImpersonation.value = false
  }
}
</script>

<template>
  <div
    v-if="isImpersonating"
    class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-user-check" class="h-5 w-5" />
        <span class="font-medium">
          Je bekijkt het paneel als <strong>{{ impersonatedUserName }}</strong>
        </span>
      </div>
      <UButton
        label="Stop impersonatie"
        color="neutral"
        variant="solid"
        size="xs"
        :loading="isStoppingImpersonation"
        @click="stopImpersonating"
      />
    </div>
  </div>
</template>
