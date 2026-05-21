const express = require('express')
const router = express.Router()

const db = require('../db/database')

router.get('/:code', (req, res) => {
  const code = req.params.code

  db.get(
    `
    SELECT
      m.*,
      c.code AS college_code,
      c.name_zh AS college_name_zh,
      c.name_en AS college_name_en
    FROM majors m
    LEFT JOIN colleges c
      ON m.college_code = c.code
    WHERE m.code=?
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
