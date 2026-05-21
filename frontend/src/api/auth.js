const API_BASE_URL = 'http://localhost:3000/api'

export async function loginWithBitAccount(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()

  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || '登录失败')
  }

  return result.data
}
