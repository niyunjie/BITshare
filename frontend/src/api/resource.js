import { apiGet } from './http'

export function getResources(courseCode) {
  return apiGet(`/resources/${courseCode}`)
}
