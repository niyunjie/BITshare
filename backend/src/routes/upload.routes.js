const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const db = require('../db/database')

const upload = multer({ dest: 'temp/' })

router.post('/', upload.single('file'), (req, res) => {

  const {
    course_code,
    type,
    title,
    academic_year
  } = req.body

  const file = req.file

  if (!file) {
    res.status(400).json({ code: 400, message: 'no file uploaded' })
    return
  }

  // 修复中文文件名乱码
  const originalName = Buffer
    .from(file.originalname, 'latin1')
    .toString('utf8')

  // timestamp + 原文件名
  const timestamp = Date.now()
  const filename = `${timestamp}-${originalName}`

  const dir = path.join(
    __dirname,
    '../../storage/courses',
    course_code,
    type
  )

  fs.mkdirSync(dir, { recursive: true })

  const newPath = path.join(dir, filename)

  fs.renameSync(file.path, newPath)

  db.run(
    `
    INSERT INTO resources
    (course_code,type,title,filename,original_name,academic_year)
    VALUES (?,?,?,?,?,?)
    `,
    [
      course_code,
      type,
      title || originalName,
      filename,
      originalName,
      academic_year
    ],
    (err) => {

      if (err) {
        console.error(err)
        res.status(500).json({ code: 500 })
        return
      }

      res.json({
        code: 0,
        message: 'upload success'
      })

    }
  )

})

module.exports = router