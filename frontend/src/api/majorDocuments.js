import { apiGet } from './http'

export function getMajorDocuments(majorCode) {
  return apiGet(`/major-documents/${majorCode}`)
}
