import { describe, expect, it } from 'vitest'

import {
  createDefaultBlock,
  createSection,
  getBlockLayout,
  insertBlock,
  moveItem,
} from './builderModel'

describe('builderModel', () => {
  it('creates property cards with the expected configurable defaults', () => {
    const block = createDefaultBlock('PropertyCard')

    expect(block.type).toBe('PropertyCard')
    expect(block.layout).toBe('Vertical')
    expect(block.actionPlacement).toBe('AfterContent')
    expect(block.actionLabel).toBe('View property')
  })

  it('falls back to a horizontal layout for social links without an explicit layout', () => {
    const block = createDefaultBlock('SocialLinks')
    delete block.layout

    expect(getBlockLayout(block)).toBe('Horizontal')
  })

  it('creates sections whose column widths still sum to one hundred percent', () => {
    const section = createSection(3)
    const totalWidth = section.columns.reduce((sum, column) => sum + column.widthPercentage, 0)

    expect(section.columns).toHaveLength(3)
    expect(totalWidth).toBe(100)
  })

  it('inserts a block before the requested target block', () => {
    const first = createDefaultBlock('Text')
    const target = createDefaultBlock('Button')
    const inserted = createDefaultBlock('Badge')

    const nextBlocks = insertBlock([first, target], inserted, target.id)

    expect(nextBlocks.map((block) => block.id)).toEqual([first.id, inserted.id, target.id])
  })

  it('moves an item inside the same array', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })
})
