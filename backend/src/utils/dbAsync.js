const db = require('../db/database')

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err)
        return
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes
      })
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
        return
      }

      resolve(row || null)
    })
  })
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
        return
      }

      resolve(rows || [])
    })
  })
}

module.exports = {
  all,
  get,
  run
}
