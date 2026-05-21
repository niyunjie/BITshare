const crypto = require('crypto')

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

function normalizeOptionalText(value) {
  const text = String(value || '').trim()
  return text || null
}

function normalizeRequiredText(value) {
  return String(value || '').trim()
}

module.exports = {
  buildUniqueCode,
  normalizeOptionalText,
  normalizeRequiredText
}
