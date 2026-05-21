const express = require('express')

const db = require('../db/database')

const router = express.Router()

router.get('/major/:code', (req, res) => {
  const majorCode = req.params.code

  db.all(
    `
      SELECT
        c.course_code,
        c.name_zh,
        c.name_en,
        c.credit,
        mc.category,
        mc.recommended_term
      FROM courses c
      JOIN major_courses mc
        ON c.course_code = mc.course_code
      WHERE mc.major_code=?
      ORDER BY c.course_code
    `,
    [majorCode],
    (err, rows) => {
      if (err) {
        res.status(500).json({ code: 500 })
        return
      }

      res.json({
        code: 0,
        data: rows
      })
    }
  )
})

router.get('/college/:code', (req, res) => {
  const collegeCode = req.params.code

  db.all(
    `
      SELECT
        course_code,
        name_zh,
        name_en,
        credit
      FROM courses
      WHERE offering_college_code=?
      ORDER BY name_zh COLLATE NOCASE, course_code
    `,
    [collegeCode],
    (err, rows) => {
      if (err) {
        res.status(500).json({ code: 500 })
        return
      }

      res.json({
        code: 0,
        data: rows
      })
    }
  )
})

module.exports = router
