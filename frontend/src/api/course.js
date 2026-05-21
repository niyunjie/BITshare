import { apiGet } from './http'

export function getMajorCourses(majorCode) {
  return apiGet(`/courses/major/${majorCode}`)
}

export function getCollegeCourses(collegeCode) {
  return apiGet(`/courses/college/${collegeCode}`)
}
