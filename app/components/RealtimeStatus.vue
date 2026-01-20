<script setup lang="ts">
const { isConnected, lastError } = useRealtime()
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      class="h-2 w-2 rounded-full transition-colors"
      :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
    />
    <span class="text-xs text-gray-500 dark:text-gray-400">
      {{ isConnected ? 'Live' : (lastError || 'Connecting...') }}
    </span>
  </div>
</template>
