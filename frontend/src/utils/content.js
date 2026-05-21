export function pickText(locale, zh, en, fallback = '-') {
  const primary = locale === 'en' ? en : zh
  const secondary = locale === 'en' ? zh : en

  return primary || secondary || fallback
}

export function buildCollegePalette(code = '') {
  const palettes = {
    automation: ['#0b4f6c', '#1f7a8c'],
    cs: ['#7c2d12', '#ea580c'],
    me: ['#14532d', '#3f6212']
  }

  return palettes[code] || ['#1f2937', '#475569']
}

export function buildInitials(value = '') {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || '')
    .join('') || 'BT'
}
