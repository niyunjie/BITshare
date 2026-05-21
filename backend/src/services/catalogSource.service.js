const fs = require('fs')
const path = require('path')

const { buildUniqueCode, normalizeOptionalText, normalizeRequiredText } = require('../utils/catalogCodes')

const projectRoot = path.join(__dirname, '../../..')
const dataRoot = path.join(projectRoot, 'backend', 'data')
const collegeMajorPath = path.join(dataRoot, 'college_major.json')
const coursesPath = path.join(dataRoot, 'courses.json')

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

function getCollegeMajorPath() {
  return collegeMajorPath
}

function getCoursesPath() {
  return coursesPath
}

function readCollegeMajorSource() {
  const data = readJson(collegeMajorPath)
  const items = Array.isArray(data) ? data : Array.isArray(data.colleges) ? data.colleges : []
  const collegeCodes = new Set()
  const majorCodes = new Set()

  return items
    .map((collegeEntry, collegeIndex) => {
      const nameZh = normalizeRequiredText(collegeEntry['学院'] || collegeEntry.name_zh || collegeEntry.name)
      if (!nameZh) {
        return null
      }

      const majorsRaw = Array.isArray(collegeEntry['专业'])
        ? collegeEntry['专业']
        : Array.isArray(collegeEntry.majors)
          ? collegeEntry.majors
          : []

      const collegeCode =
        normalizeOptionalText(collegeEntry.code) ||
        buildUniqueCode('college', `${nameZh}:${collegeIndex + 1}`, collegeCodes)

      const duplicateCountByName = new Map()
      const majors = majorsRaw
        .map((majorEntry, majorIndex) => {
          const nameValue =
            typeof majorEntry === 'string'
              ? majorEntry
              : majorEntry.name_zh || majorEntry.name || majorEntry['专业']
          const nameZhMajor = normalizeRequiredText(nameValue)

          if (!nameZhMajor) {
            return null
          }

          const occurrence = (duplicateCountByName.get(nameZhMajor) || 0) + 1
          duplicateCountByName.set(nameZhMajor, occurrence)

          const code =
            normalizeOptionalText(typeof majorEntry === 'string' ? '' : majorEntry.code) ||
            buildUniqueCode(
              'major',
              `${collegeCode}:${nameZhMajor}:${occurrence}:${majorIndex + 1}`,
              majorCodes
            )

          return {
            code,
            name_zh: nameZhMajor,
            name_en: normalizeOptionalText(typeof majorEntry === 'string' ? '' : majorEntry.name_en),
            intro: normalizeOptionalText(typeof majorEntry === 'string' ? '' : majorEntry.intro)
          }
        })
        .filter(Boolean)

      return {
        code: collegeCode,
        name_zh: nameZh,
        name_en: normalizeOptionalText(collegeEntry.name_en),
        intro: normalizeOptionalText(collegeEntry.intro),
        cover_image: normalizeOptionalText(collegeEntry.cover_image),
        aliases: Array.isArray(collegeEntry.aliases)
          ? collegeEntry.aliases.map((alias) => normalizeRequiredText(alias)).filter(Boolean)
          : [],
        majors
      }
    })
    .filter(Boolean)
}

function writeCollegeMajorSource(colleges) {
  const normalized = {
    updated_at: new Date().toISOString(),
    colleges: colleges.map((college) => ({
      code: college.code,
      name_zh: college.name_zh,
      name_en: college.name_en || '',
      intro: college.intro || '',
      cover_image: college.cover_image || '',
      aliases: Array.isArray(college.aliases) ? college.aliases : [],
      majors: (college.majors || []).map((major) => ({
        code: major.code,
        name_zh: major.name_zh,
        name_en: major.name_en || '',
        intro: major.intro || ''
      }))
    }))
  }

  fs.writeFileSync(collegeMajorPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

function readCoursesSource() {
  const data = readJson(coursesPath)
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data.rows)
      ? data.rows
      : Array.isArray(data.courses)
        ? data.courses
        : []

  const courses = rows
    .map((row) => {
      const courseCode = normalizeRequiredText(row.course_code || row.code)
      const nameZh = normalizeRequiredText(row.course_name || row.name_zh || row.name)

      if (!courseCode || !nameZh) {
        return null
      }

      return {
        course_code: courseCode,
        name_zh: nameZh,
        name_en: normalizeOptionalText(row.course_name_en || row.name_en),
        credit: normalizeOptionalText(row.credits || row.credit),
        description: normalizeOptionalText(row.description),
        offering_unit_name: normalizeOptionalText(
          row.offering_unit || row.offering_college_name || row.college_name_zh
        ),
        course_category: normalizeOptionalText(row.course_category),
        course_nature: normalizeOptionalText(row.course_nature),
        hour_unit: normalizeOptionalText(row.hour_unit),
        total_hours: normalizeOptionalText(row.total_hours),
        zh_outline_url: normalizeOptionalText(row.zh_outline_url),
        en_outline_url: normalizeOptionalText(row.en_outline_url)
      }
    })
    .filter(Boolean)

  return {
    meta: Array.isArray(data)
      ? {}
      : {
          fetched_at: normalizeOptionalText(data.fetched_at),
          source_url: normalizeOptionalText(data.source_url),
          total_items: data.total_items || courses.length,
          rows_collected: data.rows_collected || courses.length,
          status: normalizeOptionalText(data.status)
        },
    courses
  }
}

module.exports = {
  getCollegeMajorPath,
  getCoursesPath,
  readCollegeMajorSource,
  readCoursesSource,
  writeCollegeMajorSource
}
