import { describe, expect, it } from 'vitest'
import { joinTextItems } from './pdfText.js'

describe('joinTextItems', () => {
  it('joins items on the same line with a space, not a line break', () => {
    const items = [{ str: 'Bodily', hasEOL: false }, { str: 'Injury', hasEOL: false }, { str: 'Liability', hasEOL: true }]
    expect(joinTextItems(items)).toBe('Bodily Injury Liability\n')
  })

  it('inserts a real line break wherever pdf.js flags hasEOL, not just once per page', () => {
    // Regression: the old join-everything-with-a-space behavior collapsed a
    // tabular declarations page's separate lines into one run-on line,
    // which let an unrelated line's negation ("Not Included") bleed into a
    // different, unrelated coverage's negation-detection window.
    const items = [
      { str: 'Cargo Coverage $100,000', hasEOL: true },
      { str: 'Bobtail Coverage Not Included', hasEOL: true },
    ]
    expect(joinTextItems(items)).toBe('Cargo Coverage $100,000\nBobtail Coverage Not Included\n')
  })

  it('handles an item with no str (falsy) without inserting the literal string "undefined"', () => {
    const items = [{ str: 'Comprehensive', hasEOL: false }, { hasEOL: false }, { str: '$500', hasEOL: true }]
    expect(joinTextItems(items)).toBe('Comprehensive  $500\n')
  })

  it('returns an empty string for an empty items array', () => {
    expect(joinTextItems([])).toBe('')
  })
})
