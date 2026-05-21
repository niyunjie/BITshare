const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')

const db = require('../db/database')

router.get('/:courseCode',(req,res)=>{

  const code = req.params.courseCode

  db.all(
    'SELECT * FROM resources WHERE course_code=?',
    [code],
    (err,rows)=>{

      if(err){
        res.status(500).json({code:500})
        return
      }

      const valid = rows.filter(r=>{

        if(!r.filename){
          return false
        }

        const filePath = path.join(
          __dirname,
          '../../storage/courses',
          r.course_code,
          r.type,
          r.filename
        )

        return fs.existsSync(filePath)

      })

      res.json({
        code:0,
        data:valid
      })

    }
  )

})

module.exports = router