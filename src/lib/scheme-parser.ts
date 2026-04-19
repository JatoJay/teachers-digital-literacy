export interface SchemeWeek {
  number: number
  topic: string
}

const WEEK_HEADING_REGEX = /^#{1,4}\s*Week\s+(\d+)\s*[:\-–—]\s*(.+?)\s*$/gim

export function parseSchemeWeeks(content: string): SchemeWeek[] {
  if (!content) return []

  const seen = new Map<number, SchemeWeek>()
  WEEK_HEADING_REGEX.lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = WEEK_HEADING_REGEX.exec(content)) !== null) {
    const number = parseInt(match[1], 10)
    if (Number.isNaN(number)) continue

    const topic = match[2]
      .replace(/[*_`]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!topic) continue

    if (!seen.has(number)) {
      seen.set(number, { number, topic })
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.number - b.number)
}
