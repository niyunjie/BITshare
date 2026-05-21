import { defineStore } from 'pinia'

const STORAGE_KEY = 'bitshare-user'

function readStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {
      isLogin: false,
      token: '',
      userInfo: null
    }
  }

  try {
    const parsed = JSON.parse(raw)

    return {
      isLogin: Boolean(parsed.token),
      token: parsed.token || '',
      userInfo: parsed.userInfo || null
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)

    return {
      isLogin: false,
      token: '',
      userInfo: null
    }
  }
}

function persistUserState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: state.token,
      userInfo: state.userInfo
    })
  )
}

export const useUserStore = defineStore('user', {
  state: () => readStoredUser(),

  actions: {
    login(payload) {
      this.isLogin = true
      this.token = payload.fakeCookie
      this.userInfo = payload.user
      persistUserState(this)
    },

    logout() {
      this.isLogin = false
      this.token = ''
      this.userInfo = null
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
