const API_BASE_URL = 'http://localhost:3000/api'

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`)
  const result = await response.json()

  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || 'Request failed')
  }

  return result.data
}

export { API_BASE_URL }
