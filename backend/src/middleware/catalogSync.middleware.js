const { ensureCatalogSynced } = require('../services/catalogSync.service')

async function catalogSyncMiddleware(req, res, next) {
  try {
    await ensureCatalogSynced()
    next()
  } catch (error) {
    console.error('Catalog sync failed:', error)
    res.status(500).json({
      code: 500,
      message: 'catalog sync failed'
    })
  }
}

module.exports = {
  catalogSyncMiddleware
}
