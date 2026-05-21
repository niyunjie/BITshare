const express = require('express')

const db = require('../db/database')

const router = express.Router()

router.get('/', (req, res) => {
  const keyword = String(req.query.q || '').trim()

  if (!keyword) {
    res.json({
      code: 0,
      data: {
        colleges: [],
        majors: [],
        courses: []
      }
    })
    return
  }

  const collegeSql = `
    SELECT
      code,
      name_zh,
      name_en,
      intro
    FROM colleges
    WHERE instr(name_zh, ?) > 0
      OR instr(lower(name_en), lower(?)) > 0
    ORDER BY code
    LIMIT 20
  `

  const majorSql = `
    SELECT
      m.code,
      m.college_code,
      m.name_zh,
      m.name_en,
      m.intro,
      c.name_zh AS college_name_zh,
      c.name_en AS college_name_en
    FROM majors m
    LEFT JOIN colleges c
      ON m.college_code = c.code
    WHERE instr(m.name_zh, ?) > 0
      OR instr(lower(m.name_en), lower(?)) > 0
    ORDER BY m.code
    LIMIT 30
  `

  const courseSql = `
    SELECT
      c.course_code,
      c.name_zh,
      c.name_en,
      c.credit,
      c.description,
      col.code AS college_code,
      col.name_zh AS college_name_zh,
      col.name_en AS college_name_en
    FROM courses c
    LEFT JOIN colleges col
      ON c.offering_college_code = col.code
    WHERE instr(c.name_zh, ?) > 0
      OR instr(lower(c.name_en), lower(?)) > 0
    ORDER BY c.course_code
    LIMIT 50
  `

  db.all(courseSql, [keyword, keyword], (courseErr, courses) => {
    if (courseErr) {
      res.status(500).json({ code: 500, message: 'database error' })
      return
    }

    db.all(majorSql, [keyword, keyword], (majorErr, majors) => {
      if (majorErr) {
        res.status(500).json({ code: 500, message: 'database error' })
        return
      }

      db.all(collegeSql, [keyword, keyword], (collegeErr, colleges) => {
        if (collegeErr) {
          res.status(500).json({ code: 500, message: 'database error' })
          return
        }

        res.json({
          code: 0,
          data: {
            courses,
            majors,
            colleges
          }
        })
      })
    })
  })
})

module.exports = router
