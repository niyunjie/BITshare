const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const crypto = require('crypto')

const workspaceRoot = path.join(__dirname, '..', '..')
const workbookPath = path.join(workspaceRoot, '学院及专业.xlsx')
const readerScriptPath = path.join(__dirname, 'read-college-major-workbook.ps1')
const outputDir = path.join(__dirname, '..', 'data', 'catalog')
const outputPath = path.join(outputDir, 'colleges-majors.json')

function buildHash(input) {
  return crypto.createHash('sha1').update(String(input)).digest('hex').slice(0, 10)
}

function buildUniqueCode(prefix, seed, existingCodes) {
  const base = `${prefix}-${buildHash(seed)}`

  if (!existingCodes.has(base)) {
    existingCodes.add(base)
    return base
  }

  let index = 2
  let next = `${base}-${index}`

  while (existingCodes.has(next)) {
    index += 1
    next = `${base}-${index}`
  }

  existingCodes.add(next)
  return next
}

function normalizeRequiredText(value) {
  return String(value || '').trim()
}

function readWorkbookRows() {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      readerScriptPath,
      '-WorkbookPath',
      workbookPath
    ],
    {
      cwd: workspaceRoot,
      encoding: 'utf8'
    }
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to read workbook')
  }

  return JSON.parse(result.stdout)
}

function buildCatalog(rows) {
  const collegeCodeSet = new Set()
  const majorCodeSet = new Set()
  const collegeMap = new Map()
  const majors = []

  for (const row of rows) {
    const collegeName = normalizeRequiredText(row.college_name_zh)
    const majorName = normalizeRequiredText(row.major_name_zh)

    if (!collegeName || !majorName) {
      continue
    }

    let college = collegeMap.get(collegeName)

    if (!college) {
      college = {
        code: buildUniqueCode('college', collegeName, collegeCodeSet),
        name_zh: collegeName,
        name_en: null,
        intro: null,
        cover_image: null,
        source_order: row.college_order
      }
      collegeMap.set(collegeName, college)
    }

    majors.push({
      code: buildUniqueCode('major', `${college.code}:${majorName}:${row.source_row}`, majorCodeSet),
      college_code: college.code,
      name_zh: majorName,
      name_en: null,
      intro: null,
      source_row: row.source_row,
      source_order: row.major_order,
      original_college_name_zh: collegeName
    })
  }

  return {
    generated_at: new Date().toISOString(),
    source_file: path.relative(workspaceRoot, workbookPath).replace(/\\/g, '/'),
    colleges: Array.from(collegeMap.values()).sort((a, b) => a.source_order - b.source_order),
    majors: majors.slice().sort((a, b) => a.source_row - b.source_row)
  }
}

function main() {
  const rows = readWorkbookRows()
  const catalog = buildCatalog(rows)

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')

  console.log(`Catalog JSON written to ${outputPath}`)
  console.log(`Colleges: ${catalog.colleges.length}`)
  console.log(`Majors: ${catalog.majors.length}`)
}

main()

