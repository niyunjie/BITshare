<template>
  <div class="shell">
    <AppHeader />
    <main class="shell-main">
      <div
        v-if="slots.hero"
        :class="['shell-layer', 'shell-layer-top', { 'shell-layer-plain': plainHero }]"
      >
        <slot name="hero" />
      </div>
      <div
        v-if="slots.middle"
        :class="['shell-layer', 'shell-layer-middle', { 'shell-layer-plain': plainMiddle }]"
      >
        <slot name="middle" />
      </div>
      <div
        v-if="slots.bottom"
        :class="['shell-layer', 'shell-layer-bottom', { 'shell-layer-plain': plainBottom }]"
      >
        <slot name="bottom" />
      </div>
      <div
        v-if="slots.extra"
        :class="['shell-layer', 'shell-layer-extra', { 'shell-layer-plain': plainExtra }]"
      >
        <slot name="extra" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { useSlots } from 'vue'

import AppHeader from './AppHeader.vue'

defineProps({
  plainHero: {
    type: Boolean,
    default: false
  },
  plainMiddle: {
    type: Boolean,
    default: false
  },
  plainBottom: {
    type: Boolean,
    default: false
  },
  plainExtra: {
    type: Boolean,
    default: false
  }
})

const slots = useSlots()
</script>

<style scoped>
.shell {
  min-height: 100vh;
}

.shell-main {
  width: min(1320px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
  display: grid;
  gap: 20px;
}

.shell-layer {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  padding: 24px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.shell-layer-top {
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 40%),
    rgba(255, 255, 255, 0.9);
}

.shell-layer-middle,
.shell-layer-bottom,
.shell-layer-extra {
  display: grid;
  gap: 20px;
}

.shell-layer-plain {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .shell-main {
    width: min(100vw - 20px, 1320px);
    padding-top: 16px;
  }

  .shell-layer {
    padding: 18px;
    border-radius: 22px;
  }
}
</style>
