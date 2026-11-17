<template lang="pug">
.p-4
  form-builder(v-model="builderDefinition" :storage-key="true")
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FormBuilder, type FormDefinition } from '../../src'

const builderDefinition = ref<Partial<FormDefinition>>({})
</script>
