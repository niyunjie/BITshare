const fs = require('fs')

const { all, run } = require('../utils/dbAsync')
const { buildUniqueCode } = require('../utils/catalogCodes')
const {
  getCollegeMajorPath,
  getCoursesPath,
  readCollegeMajorSource,
  readCoursesSource
} = require('./catalogSource.service')

let lastSignature = ''
let syncPromise = null

function getFileSnapshot(filePath) {
  const stat = fs.statSync(filePath)
  return {
    filePath,
    mtimeMs: stat.mtimeMs,
    size: stat.size
  }
}

function getSnapshotSignature(snapshot) {
  return JSON.stringify(snapshot)
}

function getCatalogSnapshot() {
  return {
    collegeMajor: getFileSnapshot(getCollegeMajorPath()),
    courses: getFileSnapshot(getCoursesPath())
  }
}

function buildVirtualCollegeIntro(unitName, courseCount) {
  return `${unitName} 的课程来自 courses.json 中暂未纳入学院-专业目录的开课单位，当前收录 ${courseCount} 门课程，仅提供课程浏览，不单独维护专业。`
}

async function replaceCatalogData(snapshot) {
  const colleges = readCollegeMajorSource()
  const { courses, meta } = readCoursesSource()
  const collegeCodeByName = new Map()
  const collegeCodes = new Set(colleges.map((college) => college.code))
  const virtualCollegeCodeByUnit = new Map()
  const virtualCollegeCourseCount = new Map()
  const issues = []

  for (const college of colleges) {
    collegeCodeByName.set(college.name_zh, college.code)

    for (const alias of college.aliases || []) {
      if (!collegeCodeByName.has(alias)) {
        collegeCodeByName.set(alias, college.code)
      }
    }
  }

  const normalizedCourses = courses.map((course) => {
    const offeringUnitName = course.offering_unit_name || '未标注开课单位'
    let matchedCollegeCode = offeringUnitName ? collegeCodeByName.get(offeringUnitName) || null : null

    if (!matchedCollegeCode) {
      if (!virtualCollegeCodeByUnit.has(offeringUnitName)) {
        virtualCollegeCodeByUnit.set(
          offeringUnitName,
          buildUniqueCode('virtual-college', offeringUnitName, collegeCodes)
        )
      }

      matchedCollegeCode = virtualCollegeCodeByUnit.get(offeringUnitName)
      virtualCollegeCourseCount.set(
        offeringUnitName,
        (virtualCollegeCourseCount.get(offeringUnitName) || 0) + 1
      )

      issues.push({
        dataset: 'courses',
        issue_type: 'grouped_to_other_section',
        entity_key: course.course_code,
        message: `Offering unit "${offeringUnitName}" was grouped into the Other section`,
        payload: JSON.stringify({
          course_code: course.course_code,
          offering_unit_name: offeringUnitName,
          grouped_college_code: matchedCollegeCode
        })
      })
    }

    return {
      ...course,
      offering_college_code: matchedCollegeCode
    }
  })

  const virtualColleges = [...virtualCollegeCodeByUnit.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], 'zh-CN'))
    .map(([unitName, code]) => ({
      code,
      name_zh: unitName,
      name_en: null,
      intro: buildVirtualCollegeIntro(unitName, virtualCollegeCourseCount.get(unitName) || 0),
      cover_image: null,
      majors: [],
      is_virtual: 1
    }))

  const collegesToInsert = [
    ...colleges.map((college) => ({
      ...college,
      is_virtual: 0
    })),
    ...virtualColleges
  ]

  await run('BEGIN TRANSACTION')

  try {
    await run('DELETE FROM catalog_sync_issues')
    await run('DELETE FROM major_courses')
    await run('DELETE FROM majors')
    await run('DELETE FROM colleges')
    await run('DELETE FROM courses')

    for (const college of collegesToInsert) {
      await run(
        `
          INSERT INTO colleges (code, name_zh, name_en, intro, cover_image, is_virtual)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          college.code,
          college.name_zh,
          college.name_en,
          college.intro,
          college.cover_image,
          college.is_virtual
        ]
      )

      for (const major of college.majors) {
        await run(
          `
            INSERT INTO majors (code, college_code, name_zh, name_en, intro)
            VALUES (?, ?, ?, ?, ?)
          `,
          [major.code, college.code, major.name_zh, major.name_en, major.intro]
        )
      }
    }

    for (const course of normalizedCourses) {
      await run(
        `
          INSERT INTO courses (
            course_code,
            name_zh,
            name_en,
            credit,
            description,
            offering_college_code,
            offering_unit_name,
            course_category,
            course_nature,
            hour_unit,
            total_hours,
            zh_outline_url,
            en_outline_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          course.course_code,
          course.name_zh,
          course.name_en,
          course.credit,
          course.description,
          course.offering_college_code,
          course.offering_unit_name,
          course.course_category,
          course.course_nature,
          course.hour_unit,
          course.total_hours,
          course.zh_outline_url,
          course.en_outline_url
        ]
      )
    }

    for (const issue of issues) {
      await run(
        `
          INSERT INTO catalog_sync_issues (dataset, issue_type, entity_key, message, payload)
          VALUES (?, ?, ?, ?, ?)
        `,
        [issue.dataset, issue.issue_type, issue.entity_key, issue.message, issue.payload]
      )
    }

    const syncedAt = new Date().toISOString()

    await run('DELETE FROM catalog_sync_state')

    await run(
      `
        INSERT INTO catalog_sync_state
          (dataset, file_path, file_mtime_ms, file_size, synced_at, record_count, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'college_major',
        snapshot.collegeMajor.filePath,
        snapshot.collegeMajor.mtimeMs,
        snapshot.collegeMajor.size,
        syncedAt,
        collegesToInsert.length,
        JSON.stringify({
          major_count: colleges.reduce((sum, item) => sum + item.majors.length, 0),
          official_college_count: colleges.length,
          other_college_count: virtualColleges.length
        })
      ]
    )

    await run(
      `
        INSERT INTO catalog_sync_state
          (dataset, file_path, file_mtime_ms, file_size, synced_at, record_count, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'courses',
        snapshot.courses.filePath,
        snapshot.courses.mtimeMs,
        snapshot.courses.size,
        syncedAt,
        normalizedCourses.length,
        JSON.stringify(meta)
      ]
    )

    await run('COMMIT')

    return {
      synced_at: syncedAt,
      college_count: collegesToInsert.length,
      major_count: colleges.reduce((sum, item) => sum + item.majors.length, 0),
      course_count: normalizedCourses.length,
      issue_count: issues.length,
      other_college_count: virtualColleges.length
    }
  } catch (error) {
    await run('ROLLBACK')
    throw error
  }
}

async function ensureCatalogSynced(force = false) {
  const snapshot = getCatalogSnapshot()
  const signature = getSnapshotSignature(snapshot)

  if (!force && signature === lastSignature) {
    return
  }

  if (syncPromise) {
    return syncPromise
  }

  syncPromise = replaceCatalogData(snapshot)
    .then((result) => {
      lastSignature = signature
      return result
    })
    .finally(() => {
      syncPromise = null
    })

  return syncPromise
}

async function getCatalogStatus() {
  const [state, issues] = await Promise.all([
    all('SELECT * FROM catalog_sync_state ORDER BY dataset'),
    all('SELECT * FROM catalog_sync_issues ORDER BY dataset, issue_type, entity_key LIMIT 200')
  ])

  return {
    state,
    issues
  }
}

module.exports = {
  ensureCatalogSynced,
  getCatalogStatus
}
