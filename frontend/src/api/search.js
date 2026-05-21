import { apiGet } from './http'

export function searchKeyword(keyword) {
  return apiGet(`/search?q=${encodeURIComponent(keyword)}`)
}
