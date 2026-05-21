const db = require('./database')

function addColumnIfMissing(sql) {
  db.run(sql, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
      console.error('Schema migration error:', err.message)
    }
  })
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name_zh TEXT,
      name_en TEXT,
      intro TEXT,
      cover_image TEXT
    )
  `)
  addColumnIfMissing('ALTER TABLE colleges ADD COLUMN is_virtual INTEGER DEFAULT 0')

  db.run(`
    CREATE TABLE IF NOT EXISTS majors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      college_code TEXT,
      name_zh TEXT,
      name_en TEXT,
      intro TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE,
      name_zh TEXT,
      name_en TEXT,
      credit REAL,
      description TEXT
    )
  `)

  addColumnIfMissing('ALTER TABLE courses ADD COLUMN offering_college_code TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN offering_unit_name TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN course_category TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN course_nature TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN hour_unit TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN total_hours TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN zh_outline_url TEXT')
  addColumnIfMissing('ALTER TABLE courses ADD COLUMN en_outline_url TEXT')

  db.run(`
    CREATE TABLE IF NOT EXISTS major_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      major_code TEXT,
      course_code TEXT,
      category TEXT,
      recommended_term INTEGER
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT,
      type TEXT,
      title TEXT,
      filename TEXT,
      original_name TEXT,
      academic_year TEXT,
      description TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS catalog_sync_state (
      dataset TEXT PRIMARY KEY,
      file_path TEXT,
      file_mtime_ms INTEGER,
      file_size INTEGER,
      synced_at TEXT,
      record_count INTEGER,
      details TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS catalog_sync_issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset TEXT,
      issue_type TEXT,
      entity_key TEXT,
      message TEXT,
      payload TEXT
    )
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_colleges_name_zh ON colleges(name_zh)')
  db.run('CREATE INDEX IF NOT EXISTS idx_colleges_is_virtual ON colleges(is_virtual)')
  db.run('CREATE INDEX IF NOT EXISTS idx_majors_college_code ON majors(college_code)')
  db.run('CREATE INDEX IF NOT EXISTS idx_majors_name_zh ON majors(name_zh)')
  db.run('CREATE INDEX IF NOT EXISTS idx_courses_name_zh ON courses(name_zh)')
  db.run('CREATE INDEX IF NOT EXISTS idx_courses_offering_college_code ON courses(offering_college_code)')
  db.run('CREATE INDEX IF NOT EXISTS idx_major_courses_major_code ON major_courses(major_code)')
  db.run('CREATE INDEX IF NOT EXISTS idx_major_courses_course_code ON major_courses(course_code)')
  db.run('CREATE INDEX IF NOT EXISTS idx_resources_course_code ON resources(course_code)')
})

console.log('Database initialized')
