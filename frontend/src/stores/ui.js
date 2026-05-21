import { defineStore } from 'pinia'

const STORAGE_KEY = 'bitshare-ui'

function readStoredLocale() {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return 'zh'
  }

  try {
    const parsed = JSON.parse(stored)
    return parsed.locale === 'en' ? 'en' : 'zh'
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return 'zh'
  }
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    locale: readStoredLocale()
  }),

  actions: {
    toggleLocale() {
      this.locale = this.locale === 'zh' ? 'en' : 'zh'
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: this.locale }))
    }
  }
})
