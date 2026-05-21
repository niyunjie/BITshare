const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const catalogRoutes = require('./routes/catalog.routes')
const collegeRoutes = require('./routes/college.routes')
const collegeDetailRoutes = require('./routes/college.detail.routes')
const majorRoutes = require('./routes/major.routes')
const majorDetailRoutes = require('./routes/major.detail.routes')
const courseRoutes = require('./routes/course.routes')
const courseDetailRoutes = require('./routes/course.detail.routes')
const resourceRoutes = require('./routes/resource.routes')
const searchRoutes = require('./routes/search.routes')
const downloadRoutes = require('./routes/download.routes')
const downloadAllRoutes = require('./routes/downloadAll.routes')
const uploadRoutes = require('./routes/upload.routes')
const previewRoutes = require('./routes/preview.routes')
const majorDocumentRoutes = require('./routes/major.documents.routes')
const { catalogSyncMiddleware } = require('./middleware/catalogSync.middleware')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'Backend is running'
  })
})

app.use('/api/catalog', catalogRoutes)

app.use(
  [
    '/api/colleges',
    '/api/college',
    '/api/majors',
    '/api/major',
    '/api/courses',
    '/api/course',
    '/api/resources',
    '/api/search'
  ],
  catalogSyncMiddleware
)

app.use('/api/colleges', collegeRoutes)
app.use('/api/college', collegeDetailRoutes)
app.use('/api/major', majorDetailRoutes)
app.use('/api/majors', majorRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/course', courseDetailRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/preview', previewRoutes)
app.use('/api/major-documents', majorDocumentRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/download', downloadRoutes)
app.use('/api/download-all', downloadAllRoutes)
app.use('/api/upload', uploadRoutes)

module.exports = app
