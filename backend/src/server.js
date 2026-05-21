require('dotenv').config()

require('./db/init')

const app = require('./app')
const { ensureCatalogSynced } = require('./services/catalogSync.service')

const PORT = process.env.PORT || 3000

ensureCatalogSynced()
  .catch((error) => {
    console.error('Initial catalog sync failed:', error)
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`BITshare backend running at http://localhost:${PORT}`)
    })
  })
