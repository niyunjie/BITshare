import { apiGet } from './http'

export function getColleges() {
  return apiGet('/colleges')
}

export function getCollegeDetail(code) {
  return apiGet(`/college/${code}`)
}
