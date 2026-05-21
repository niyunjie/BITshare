const express = require('express')

const db = require('../db/database')

const router = express.Router()

router.get('/:code', (req, res) => {
  const code = req.params.code

  db.get(
    `
      SELECT
        c.*,
        m.code AS major_code,
        m.name_zh AS major_name_zh,
        m.name_en AS major_name_en,
        col.code AS college_code,
        col.name_zh AS college_name_zh,
        col.name_en AS college_name_en
      FROM courses c
      LEFT JOIN major_courses mc
        ON c.course_code = mc.course_code
      LEFT JOIN majors m
        ON mc.major_code = m.code
      LEFT JOIN colleges col
        ON COALESCE(c.offering_college_code, m.college_code) = col.code
      WHERE c.course_code=?
    `,
    [code],
    (err, row) => {
      if (err) {
        res.status(500).json({ code: 500 })
        return
      }

      res.json({
        code: 0,
        data: row
      })
    }
  )
})

module.exports = router
