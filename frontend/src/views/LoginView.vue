<template>
  <div class="login-container">
    <form class="login-card" @submit.prevent="login">
      <p class="eyebrow">BITshare Secure Entry</p>
      <h1>使用北理工账号登录</h1>
      <p class="subtitle">输入统一身份认证的学号和密码即可登录，不需要单独注册。</p>
      <div class="notice">
        <strong>未登录无法访问任何业务页面</strong>
        <span>首页、学院、专业、课程和搜索结果都会被统一拦截到登录页。</span>
      </div>

      <label for="sid">学号</label>
      <input
        id="sid"
        v-model.trim="form.sid"
        type="text"
        autocomplete="username"
        placeholder="例如 1120230000"
        :disabled="loading"
      />

      <label for="password">密码</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        placeholder="请输入统一身份认证密码"
        :disabled="loading"
      />

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { loginWithBitAccount } from '../api/auth'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  sid: '',
  password: ''
})

async function login() {
  if (!form.sid || !form.password) {
    errorMessage.value = '请输入学号和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const data = await loginWithBitAccount(form)
    userStore.login(data)
    router.push('/home')
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(11, 79, 108, 0.15), transparent 35%),
    linear-gradient(180deg, #f3f6f9 0%, #e8eef4 100%);
}

.login-card {
  width: min(100%, 420px);
  padding: 32px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 50px rgba(26, 44, 74, 0.12);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  color: #0b4f6c;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}

h1 {
  margin: 0;
  font-size: 28px;
  color: #1d2a39;
}

.subtitle {
  margin: 0 0 8px;
  color: #607086;
  line-height: 1.6;
}

.notice {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(11, 79, 108, 0.08);
  color: #33536b;
  font-size: 14px;
}

.notice strong {
  color: #0f172a;
}

label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus {
  outline: none;
  border-color: #0b4f6c;
  box-shadow: 0 0 0 4px rgba(11, 79, 108, 0.12);
}

button {
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #0b4f6c 0%, #14532d 100%);
  cursor: pointer;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #b91c1c;
  font-size: 14px;
}
</style>
