const express = require('express')

const { buildUniqueCode, normalizeOptionalText, normalizeRequiredText } = require('../utils/catalogCodes')
const { ensureCatalogSynced } = require('../services/catalogSync.service')
const { readCollegeMajorSource, writeCollegeMajorSource } = require('../services/catalogSource.service')
const { all } = require('../utils/dbAsync')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const rows = await all(
      'SELECT * FROM colleges ORDER BY is_virtual ASC, name_zh COLLATE NOCASE, code'
    )
    res.json({
      code: 0,
      data: rows
    })
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'database error'
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const colleges = readCollegeMajorSource()
    const nameZh = normalizeRequiredText(req.body.name_zh)

    if (!nameZh) {
      res.status(400).json({ code: 400, message: 'name_zh is required' })
      return
    }

    const existingCollegeCodes = new Set(colleges.map((item) => item.code))
    const code =
      normalizeOptionalText(req.body.code) ||
      buildUniqueCode('college', `${nameZh}:${colleges.length + 1}`, existingCollegeCodes)

    colleges.push({
      code,
      name_zh: nameZh,
      name_en: normalizeOptionalText(req.body.name_en),
      intro: normalizeOptionalText(req.body.intro),
      cover_image: normalizeOptionalText(req.body.cover_image),
      aliases: Array.isArray(req.body.aliases)
        ? req.body.aliases.map((alias) => normalizeRequiredText(alias)).filter(Boolean)
        : [],
      majors: []
    })

    writeCollegeMajorSource(colleges)
    await ensureCatalogSynced(true)

    res.json({
      code: 0,
      data: { college_code: code }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'save failed' })
  }
})

router.put('/:code', async (req, res) => {
  try {
    const colleges = readCollegeMajorSource()
    const college = colleges.find((item) => item.code === req.params.code)

    if (!college) {
      res.status(404).json({ code: 404, message: 'college not found' })
      return
    }

    const nextNameZh = normalizeRequiredText(req.body.name_zh || college.name_zh)
    const aliases = new Set(Array.isArray(college.aliases) ? college.aliases : [])

    if (college.name_zh && college.name_zh !== nextNameZh) {
      aliases.add(college.name_zh)
    }

    if (Array.isArray(req.body.aliases)) {
      aliases.clear()
      req.body.aliases
        .map((alias) => normalizeRequiredText(alias))
        .filter(Boolean)
        .forEach((alias) => aliases.add(alias))
    }

    college.name_zh = nextNameZh
    college.name_en = normalizeOptionalText(req.body.name_en ?? college.name_en)
    college.intro = normalizeOptionalText(req.body.intro ?? college.intro)
    college.cover_image = normalizeOptionalText(req.body.cover_image ?? college.cover_image)
    college.aliases = [...aliases]

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
    const nextColleges = colleges.filter((item) => item.code !== req.params.code)

    if (nextColleges.length === colleges.length) {
      res.status(404).json({ code: 404, message: 'college not found' })
      return
    }

    writeCollegeMajorSource(nextColleges)
    await ensureCatalogSynced(true)

    res.json({ code: 0 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'delete failed' })
  }
})

module.exports = router
