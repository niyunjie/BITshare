const express = require('express')

const { ensureCatalogSynced, getCatalogStatus } = require('../services/catalogSync.service')

const router = express.Router()

router.get('/status', async (req, res) => {
  try {
    const status = await getCatalogStatus()
    res.json({
      code: 0,
      data: status
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'catalog status failed' })
  }
})

router.post('/sync', async (req, res) => {
  try {
    const result = await ensureCatalogSynced(true)
    res.json({
      code: 0,
      data: result
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 500, message: 'catalog sync failed' })
  }
})

module.exports = router
