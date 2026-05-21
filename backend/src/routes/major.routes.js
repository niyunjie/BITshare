const express = require('express')

const { all } = require('../utils/dbAsync')
const { buildUniqueCode, normalizeOptionalText, normalizeRequiredText } = require('../utils/catalogCodes')
const { ensureCatalogSynced } = require('../services/catalogSync.service')
const { readCollegeMajorSource, writeCollegeMajorSource } = require('../services/catalogSource.service')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const collegeCode = normalizeOptionalText(req.query.college)
    const rows = collegeCode
      ? await all('SELECT * FROM majors WHERE college_code=? ORDER BY name_zh COLLATE NOCASE, code', [collegeCode])
      : await all('SELECT * FROM majors ORDER BY name_zh COLLATE NOCASE, code')

    res.json({
      code: 0,
      data: rows
    })
  } catch (error) {
    res.status(500).json({ code: 500, message: 'database error' })
  }
})

router.post('/', async (req, res) => {
  try {
    const collegeCode = normalizeRequiredText(req.body.college_code)
    const nameZh = normalizeRequiredText(req.body.name_zh)

    if (!collegeCode || !nameZh) {
      res.status(400).json({ code: 400, message: 'college_code and name_zh are required' })
      return
    }

    const colleges = readCollegeMajorSource()
    const college = colleges.find((item) => item.code === collegeCode)

    if (!college) {
      res.status(404).json({ code: 404, message: 'college not found' })
      return
    }

    const existingCodes = new Set(
      colleges.flatMap((item) => (item.majors || []).map((major) => major.code))
    )

    const duplicateCount =
      (college.majors || []).filter((major) => major.name_zh === nameZh).length + 1

    const code =
      normalizeOptionalText(req.body.code) ||
      buildUniqueCode('major', `${collegeCode}:${nameZh}:${duplicateCount}`, existingCodes)

    college.majors = college.majors || []
    college.majors.push({
      code,
      name_zh: nameZh,
      name_en: normalizeOptionalText(req.body.name_en),
      intro: normalizeOptionalText(req.body.intro)
    })

    writeCollegeMajorSource(colleges)
    await ensureCatalogSynced(true)

    res.json({
      code: 0,
      data: { major_code: code }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'save failed' })
  }
})

router.put('/:code', async (req, res) => {
  try {
    const colleges = readCollegeMajorSource()
    const nextCollegeCode = normalizeOptionalText(req.body.college_code)

    let currentCollege = null
    let currentIndex = -1
    let currentMajor = null

    for (const college of colleges) {
      const index = (college.majors || []).findIndex((major) => major.code === req.params.code)
      if (index >= 0) {
        currentCollege = college
        currentIndex = index
        currentMajor = college.majors[index]
        break
      }
    }

    if (!currentMajor || !currentCollege) {
      res.status(404).json({ code: 404, message: 'major not found' })
      return
    }

    const targetCollege = nextCollegeCode
      ? colleges.find((item) => item.code === nextCollegeCode)
      : currentCollege

    if (!targetCollege) {
      res.status(404).json({ code: 404, message: 'target college not found' })
      return
    }

    currentCollege.majors.splice(currentIndex, 1)

    currentMajor.name_zh = normalizeRequiredText(req.body.name_zh || currentMajor.name_zh)
    currentMajor.name_en = normalizeOptionalText(req.body.name_en ?? currentMajor.name_en)
    currentMajor.intro = normalizeOptionalText(req.body.intro ?? currentMajor.intro)

    targetCollege.majors = targetCollege.majors || []
    targetCollege.majors.push(currentMajor)

    writeCollegeMajorSource(colleges)
    await ensureCatalogSynced(true)

    res.json({ code: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'update failed' })
  }
})

router.delete('/:code', async (req, res) => {
  try {
    const colleges = readCollegeMajorSource()

    let deleted = false

    for (const college of colleges) {
      const before = (college.majors || []).length
      college.majors = (college.majors || []).filter((major) => major.code !== req.params.code)
      if (college.majors.length !== before) {
        deleted = true
        break
      }
    }

    if (!deleted) {
      res.status(404).json({ code: 404, message: 'major not found' })
      return
    }

    writeCollegeMajorSource(colleges)
    await ensureCatalogSynced(true)

    res.json({ code: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'delete failed' })
  }
})

module.exports = router
