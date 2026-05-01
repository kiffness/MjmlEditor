import type { ComponentProps } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BuilderCanvas } from './BuilderCanvas'
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

function createProps(overrides?: Partial<ComponentProps<typeof BuilderCanvas>>): ComponentProps<typeof BuilderCanvas> {
  return {
    draft: createDraft(null),
    selectedSectionId: null,
    selectedColumnId: null,
    selectedBlockId: null,
    draggedSectionId: null,
    draggedBlock: null,
    sectionDropTargetId: null,
    columnDropTargetId: null,
    blockDropTargetId: null,
    handleSelectSection: vi.fn(),
    handleSelectColumn: vi.fn(),
    handleSelectBlock: vi.fn(),
    handleSectionDragStart: vi.fn(),
    handleSectionDrop: vi.fn(),
    handleBlockDragStart: vi.fn(),
    handleBlockDropOnColumn: vi.fn(),
    handleBlockDropOnBlock: vi.fn(),
    setSectionDropTargetId: vi.fn(),
    setColumnDropTargetId: vi.fn(),
    setBlockDropTargetId: vi.fn(),
    clearDragState: vi.fn(),
    handleStartBuilder: vi.fn(),
    handleAddSection: vi.fn(),
    handleDuplicateSection: vi.fn(),
    handleDeleteSection: vi.fn(),
    handleDuplicateBlock: vi.fn(),
    handleDeleteBlock: vi.fn(),
    canUndo: false,
    canRedo: false,
    handleUndo: vi.fn(),
    handleRedo: vi.fn(),
    handleUpdateSelectedBlock: vi.fn(),
    ...overrides,
  }
}

describe('BuilderCanvas', () => {
  it('renders the visual builder start state when no editor document exists', () => {
    render(<BuilderCanvas {...createProps()} />)

    expect(screen.getByText('Builder canvas')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Start a visual layout' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start with hero preset' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start blank section' })).toBeTruthy()
  })

  it('does not invent width or rounded corners for button blocks without explicit values', () => {
    render(
      <BuilderCanvas
        {...createProps({
          draft: createDraft({
            version: 1,
            sections: [
              {
                id: 'section-1',
                columns: [
                  {
                    id: 'column-1',
                    widthPercentage: 100,
                    blocks: [
                      {
                        id: 'button-1',
                        type: 'Button',
                        actionLabel: 'Explore deal',
                        actionUrl: 'https://example.com',
                        backgroundColor: '#2563eb',
                        textColor: '#ffffff',
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        })}
      />,
    )

    const buttonPreview = screen.getByTestId('builder-button-preview-button-1')

    expect(buttonPreview).toBeTruthy()
    expect(buttonPreview.style.width).toBe('')
    expect(buttonPreview.style.maxWidth).toBe('')
    expect(buttonPreview.style.borderRadius).toBe('')
  })

  it('uses an explicit width and maxWidth on the button span for percentage-sized button previews', () => {
    render(
      <BuilderCanvas
        {...createProps({
          draft: createDraft({
            version: 1,
            sections: [
              {
                id: 'section-1',
                columns: [
                  {
                    id: 'column-1',
                    widthPercentage: 100,
                    blocks: [
                      {
                        id: 'button-percent',
                        type: 'Button',
                        actionLabel: 'Available properties',
                        actionUrl: 'https://example.com',
                        backgroundColor: '#2563eb',
                        textColor: '#ffffff',
                        alignment: 'Center',
                        widthPercentage: 60,
                        borderRadius: 12,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        })}
      />,
    )

    const buttonPreview = screen.getByTestId('builder-button-preview-button-percent')

    expect(buttonPreview).toBeTruthy()
    expect(buttonPreview.style.width).toBe('60%')
    expect(buttonPreview.style.maxWidth).toBe('331px')
    expect(buttonPreview.style.borderRadius).toBe('12px')
    // No full-width wrapper div — backgroundColor must NOT appear on any ancestor
    expect(buttonPreview.parentElement?.style.backgroundColor).toBe('')
  })
})
