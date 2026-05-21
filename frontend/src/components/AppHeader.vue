<template>
  <header class="app-header">
    <router-link class="brand" to="/home">
      <span class="brand-mark">B</span>
      <span class="brand-copy">
        <strong>BITshare</strong>
        <small>{{ t.brandTagline }}</small>
      </span>
    </router-link>

    <form class="search" @submit.prevent="submitSearch">
      <input v-model.trim="keyword" :placeholder="t.searchPlaceholder" type="search" />
      <button type="submit">{{ t.searchButton }}</button>
    </form>

    <nav class="actions">
      <a
        class="github"
        href="https://github.com/latecherry/BITshare"
        target="_blank"
        rel="noreferrer"
        :aria-label="t.github"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.52v-1.82c-2.95.64-3.57-1.25-3.57-1.25-.48-1.2-1.16-1.52-1.16-1.52-.95-.65.07-.64.07-.64 1.05.07 1.6 1.08 1.6 1.08.93 1.6 2.44 1.14 3.04.87.1-.68.36-1.14.65-1.4-2.36-.27-4.84-1.18-4.84-5.25 0-1.16.42-2.1 1.08-2.84-.1-.27-.47-1.38.1-2.88 0 0 .9-.29 2.95 1.08A10.2 10.2 0 0 1 12 6.68c.9 0 1.8.12 2.65.35 2.04-1.37 2.93-1.08 2.93-1.08.58 1.5.21 2.61.1 2.88.68.74 1.08 1.68 1.08 2.84 0 4.08-2.48 4.97-4.85 5.24.37.32.7.95.7 1.92v2.85c0 .28.19.62.73.52A10.5 10.5 0 0 0 12 1.5Z"
          />
        </svg>
      </a>

      <button class="locale" type="button" @click="uiStore.toggleLocale()">
        {{ localeLabel }}
      </button>

      <div class="session">
        <div class="avatar">{{ userInitial }}</div>
        <div class="session-copy">
          <strong>{{ userName }}</strong>
          <button type="button" @click="logout">{{ t.logout }}</button>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUiStore } from '../stores/ui'
import { useUserStore } from '../stores/user'
import { buildInitials } from '../utils/content'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()
const userStore = useUserStore()

const keyword = ref(String(route.query.q || ''))

const copy = {
  zh: {
    brandTagline: '北理工课程资料共享平台',
    searchPlaceholder: '搜索课程、专业或学院标题',
    searchButton: '搜索',
    github: 'GitHub 仓库',
    logout: '退出登录'
  },
  en: {
    brandTagline: 'Resource hub for BIT courses',
    searchPlaceholder: 'Search course, major, or college titles',
    searchButton: 'Search',
    github: 'GitHub repository',
    logout: 'Sign out'
  }
}

const t = computed(() => copy[uiStore.locale])
const localeLabel = computed(() => (uiStore.locale === 'zh' ? 'EN' : '中'))
const userName = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.id || 'BIT User')
const userInitial = computed(() => buildInitials(userName.value))

watch(
  () => route.query.q,
  (value) => {
    keyword.value = String(value || '')
  }
)

function submitSearch() {
  if (!keyword.value) {
    return
  }

  router.push({
    path: '/search',
    query: {
      q: keyword.value
    }
  })
}

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(247, 249, 252, 0.88);
  backdrop-filter: blur(16px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #0f172a;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0b4f6c 0%, #14532d 100%);
  color: #fff;
  font-size: 20px;
  font-weight: 800;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-copy strong {
  font-size: 18px;
}

.brand-copy small {
  color: #64748b;
}

.search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.search input,
.search button,
.actions button {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  font: inherit;
}

.search input {
  padding: 12px 16px;
  background: #fff;
}

.search button,
.locale {
  padding: 12px 16px;
  background: #fff;
  cursor: pointer;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.github {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.github svg {
  width: 22px;
  height: 22px;
  fill: #111827;
}

.session {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.avatar {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #0b4f6c 0%, #1d4ed8 100%);
  color: #fff;
  font-weight: 700;
}

.session-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.session-copy strong {
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-copy button {
  padding: 0;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  text-align: left;
}

@media (max-width: 1080px) {
  .app-header {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .app-header {
    padding: 14px;
  }

  .search {
    grid-template-columns: 1fr;
  }

  .actions {
    gap: 10px;
  }

  .session {
    width: 100%;
    justify-content: flex-start;
    border-radius: 24px;
  }
}
</style>
