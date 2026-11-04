import { test, expect } from 'vitest'
import { safeHref } from '../src/lib/links'

test('safeHref allows legitimate links', () => {
  expect(safeHref('https://example.com')).toBe('https://example.com')
  expect(safeHref('/about')).toBe('/about')
  expect(safeHref('mailto:test@test.com')).toBe('mailto:test@test.com')
})

test('safeHref blocks malicious schemes', () => {
  expect(safeHref('javascript:alert(1)')).toBe(null)
  expect(safeHref('data:text/html,<script>alert(1)</script>')).toBe(null)
})

test('safeHref blocks control character obfuscation', () => {
  expect(safeHref('java\x00script:alert(1)')).toBe(null)
  expect(safeHref('java\nscript:alert(1)')).toBe(null)
  expect(safeHref('java\tscript:alert(1)')).toBe(null)
})
