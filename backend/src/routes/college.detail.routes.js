const express = require('express')
const router = express.Router()

const db = require('../db/database')

router.get('/:code', (req,res)=>{

  const code = req.params.code

  db.get(
    'SELECT * FROM colleges WHERE code=?',
    [code],
    (err,row)=>{

      if(err){
        res.status(500).json({code:500})
        return
      }

      res.json({
        code:0,
        data:row
      })

    }
  )

})

module.exports = router