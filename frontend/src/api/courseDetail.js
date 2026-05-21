import { apiGet } from './http'

export function getCourseDetail(code) {
  return apiGet(`/course/${code}`)
}
