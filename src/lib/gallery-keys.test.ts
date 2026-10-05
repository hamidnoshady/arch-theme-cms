import { describe, expect, it } from 'vitest'

import { stepForKey } from '@/components/media/Gallery'

describe('image viewer keys', () => {
  it('moves with the reading direction', () => {
    expect(stepForKey('ArrowRight', 0, 4, false)).toBe(1)
    expect(stepForKey('ArrowLeft', 0, 4, false)).toBe(3)
    // In Persian the next image is to the left.
    expect(stepForKey('ArrowLeft', 0, 4, true)).toBe(1)
    expect(stepForKey('ArrowRight', 0, 4, true)).toBe(3)
  })

  it('jumps to the ends and ignores other keys', () => {
    expect(stepForKey('Home', 2, 4, false)).toBe(0)
    expect(stepForKey('End', 0, 4, true)).toBe(3)
    expect(stepForKey('Enter', 0, 4, false)).toBeNull()
    expect(stepForKey('ArrowRight', 0, 0, false)).toBeNull()
  })
})
