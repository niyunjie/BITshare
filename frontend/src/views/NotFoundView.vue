<template>
  <AppShell>
    <template #hero>
      <section class="not-found">
        <h1>404</h1>
        <p>{{ message }}</p>
        <router-link class="pill-link" to="/home">{{ backHome }}</router-link>
      </section>
    </template>
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'

import AppShell from '../components/AppShell.vue'
import { useUiStore } from '../stores/ui'

const uiStore = useUiStore()

const message = computed(() =>
  uiStore.locale === 'zh' ? '页面不存在或已被移动。' : 'The page does not exist or has moved.'
)
const backHome = computed(() => (uiStore.locale === 'zh' ? '返回首页' : 'Back home'))
</script>

<style scoped>
.not-found {
  min-height: 42vh;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 14px;
}

.not-found h1 {
  margin: 0;
  font-size: 5rem;
}

.not-found p {
  margin: 0;
  color: #64748b;
}
</style>
