<script setup lang="ts">
const { locale, setLocale } = useI18n()

const toggleLocale = () => {
  setLocale(locale.value === 'nl' ? 'fr' : 'nl')
}

const buttonLabel = computed(() => locale.value === 'nl' ? 'FR' : 'NL')
</script>

<template>
  <UButton
    :label="buttonLabel"
    variant="ghost"
    color="neutral"
    size="sm"
    @click="toggleLocale"
  />
</template>
