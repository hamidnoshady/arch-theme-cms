/** A decoded path segment, or null when it cannot be a CMS slug (bad escape, separators, control characters). */
export function decodeSegment(segment: string): string | null {
  let value: string
  try {
    value = decodeURIComponent(segment).normalize('NFC')
  } catch {
    return null
  }
  if (!value || value.length > 200 || value === '.' || value === '..') return null
  if (/[/\\\u0000-\u001f\u007f]/.test(value)) return null
  return value
}
