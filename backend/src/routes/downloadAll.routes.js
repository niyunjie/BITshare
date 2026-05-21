const express = require('express')
const router = express.Router()
const archiver = require('archiver')
const path = require('path')
const fs = require('fs')

router.get('/:courseCode',(req,res)=>{

  const code = req.params.courseCode

  const dir = path.join(
    __dirname,
    '../../storage/courses',
    code
  )

  if(!fs.existsSync(dir)){
    res.status(404).json({code:404})
    return
  }

  res.attachment(`${code}.zip`)

  const archive = archiver('zip')

  archive.pipe(res)

  archive.directory(dir,false)

  archive.finalize()

})

module.exports = router