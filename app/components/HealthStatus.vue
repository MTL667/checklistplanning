<script setup lang="ts">
const { data, status, error } = await useFetch('/api/health')

const statusColor = computed(() => {
  if (status.value === 'pending') return 'yellow'
  if (error.value) return 'red'
  return 'green'
})

const statusText = computed(() => {
  if (status.value === 'pending') return 'Checking...'
  if (error.value) return 'Offline'
  return 'Online'
})
</script>

<template>
  <div class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
    <span
      class="inline-block h-2 w-2 rounded-full"
      :class="{
        'bg-green-500': statusColor === 'green',
        'bg-yellow-500': statusColor === 'yellow',
        'bg-red-500': statusColor === 'red'
      }"
    />
    <span>API: {{ statusText }}</span>
    <span v-if="data?.timestamp" class="text-xs">
      ({{ new Date(data.timestamp).toLocaleTimeString() }})
    </span>
  </div>
</template>
