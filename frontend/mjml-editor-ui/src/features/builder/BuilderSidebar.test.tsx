import type { ComponentProps } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BuilderSidebar } from './BuilderSidebar'
import type { TemplateDraft } from './builderModel'

function createDraft(editorDocument: TemplateDraft['editorDocument']): TemplateDraft {
  return {
    name: 'Campaign',
    subject: 'Subject line',
    status: 'Draft',
    mjmlBody: '<mjml></mjml>',
    editorDocument,
  }
}

function createProps(overrides?: Partial<ComponentProps<typeof BuilderSidebar>>): ComponentProps<typeof BuilderSidebar> {
  return {
    draft: createDraft(null),
    activeBuilderTab: 'blocks',
    setActiveBuilderTab: vi.fn(),
    selectedSection: null,
    selectedColumn: null,
    selectedBlock: null,
    selectedSectionId: null,
    selectedColumnId: null,
    selectedBlockId: null,
    handleAddBlock: vi.fn(),
    handlePaletteBlockDragStart: vi.fn(),
    handleAddSection: vi.fn(),
    handleAddPresetSection: vi.fn(),
    handleUpdateSection: vi.fn(),
    handleUpdateSelectedColumn: vi.fn(),
    handleUpdateSelectedColumnWidth: vi.fn(),
    handleUpdateSelectedBlock: vi.fn(),
    handleAddSelectedBlockItem: vi.fn(),
    handleUpdateSelectedBlockItem: vi.fn(),
    handleRemoveSelectedBlockItem: vi.fn(),
    handleSelectSection: vi.fn(),
    handleSelectColumn: vi.fn(),
    handleSelectBlock: vi.fn(),
    handleStartBuilder: vi.fn(),
    clearDragState: vi.fn(),
    brandColors: [],
    ...overrides,
  }
}

describe('BuilderSidebar', () => {
  it('keeps the tools content in its own scroll region on wide layouts', () => {
    render(<BuilderSidebar {...createProps()} />)

    const scrollRegion = screen.getByTestId('builder-sidebar-scroll-region')

    expect(scrollRegion.className).toContain('xl:overflow-y-auto')
    expect(scrollRegion.className).toContain('xl:flex-1')
  })
})
