<template lang="pug">
.p-4
  form-builder(v-model="builderDefinition")
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder, type FormDefinition } from '../../src'

const builderDefinition = ref<Partial<FormDefinition>>({})
</script>
