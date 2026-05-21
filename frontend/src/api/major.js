import { apiGet } from './http'

export function getMajors(collegeCode) {
  return apiGet(`/majors?college=${encodeURIComponent(collegeCode)}`)
}

export function getMajorDetail(code) {
  return apiGet(`/major/${code}`)
}
