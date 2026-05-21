<template>
  <nav v-if="items.length" class="breadcrumb" aria-label="Breadcrumb">
    <template v-for="(item, index) in items" :key="`${item.path}-${index}`">
      <router-link v-if="item.path" :to="item.path">{{ item.title }}</router-link>
      <span v-else class="current">{{ item.title }}</span>
      <span v-if="index < items.length - 1" class="divider">/</span>
    </template>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

import { useBreadcrumbStore } from '../stores/breadcrumb'

defineOptions({
  name: 'AppBreadcrumb'
})

const breadcrumb = useBreadcrumbStore()
const items = computed(() => breadcrumb.items)
</script>

<style scoped>
.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #64748b;
  font-size: 14px;
}

.breadcrumb a {
  color: #0b4f6c;
}

.current {
  color: #0f172a;
  font-weight: 600;
}

.divider {
  color: #94a3b8;
}
</style>
