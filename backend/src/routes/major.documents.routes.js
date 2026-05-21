const express = require('express')
const path = require('path')
const fs = require('fs')

const router = express.Router()

function getMajorPlanDir(majorCode) {
  return path.join(__dirname, '../../storage/majors', majorCode, 'plans')
}

function sanitizeFileName(fileName) {
  const decoded = decodeURIComponent(fileName)
  const normalized = path.basename(decoded)

  if (normalized !== decoded) {
    return null
  }

  return normalized
}

function sendInlineFile(res, filePath, fileName) {
  res.type(path.extname(fileName))
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
  )
  res.sendFile(filePath)
}

router.get('/:majorCode', (req, res) => {
  const majorCode = req.params.majorCode
  const dir = getMajorPlanDir(majorCode)

  if (!fs.existsSync(dir)) {
    res.json({
      code: 0,
      data: []
    })
    return
  }

  const files = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const parsed = path.parse(entry.name)
      const encodedName = encodeURIComponent(entry.name)

      return {
        id: encodedName,
        title: parsed.name,
        original_name: entry.name,
        preview_url: `/api/major-documents/${majorCode}/preview/${encodedName}`,
        download_url: `/api/major-documents/${majorCode}/download/${encodedName}`
      }
    })

  res.json({
    code: 0,
    data: files
  })
})

router.get('/:majorCode/preview/:fileName', (req, res) => {
  const majorCode = req.params.majorCode
  const fileName = sanitizeFileName(req.params.fileName)

  if (!fileName) {
    res.status(400).json({ code: 400 })
    return
  }

  const filePath = path.join(getMajorPlanDir(majorCode), fileName)

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ code: 404 })
    return
  }

  sendInlineFile(res, filePath, fileName)
})

router.get('/:majorCode/download/:fileName', (req, res) => {
  const majorCode = req.params.majorCode
  const fileName = sanitizeFileName(req.params.fileName)

  if (!fileName) {
    res.status(400).json({ code: 400 })
    return
  }

  const filePath = path.join(getMajorPlanDir(majorCode), fileName)

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ code: 404 })
    return
  }

  res.download(filePath, fileName)
})

module.exports = router
