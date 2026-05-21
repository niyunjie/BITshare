const express = require('express')
const path = require('path')
const fs = require('fs')

const db = require('../db/database')

const router = express.Router()

function sendInlineFile(res, filePath, fileName) {
  res.type(path.extname(fileName))
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
  )
  res.sendFile(filePath)
}

router.get('/:id', (req, res) => {
  const id = req.params.id

  db.get('SELECT * FROM resources WHERE id=?', [id], (err, row) => {
    if (err || !row) {
      res.status(404).json({ code: 404 })
      return
    }

    const filePath = path.join(
      __dirname,
      '../../storage/courses',
      row.course_code,
      row.type,
      row.filename
    )

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ code: 404 })
      return
    }

    sendInlineFile(res, filePath, row.original_name || row.filename)
  })
})

module.exports = router
