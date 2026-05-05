import { useState } from 'react'
import type { SavedSectionDto } from '../../lib/api'
import type { EditorSection, EditorBlock, EditorBlockItem, EditorBlockType, EditorColumn, BrandColorDto } from '../../lib/api'
import { BuilderCanvas } from './BuilderCanvas'
import { BuilderSidebar } from './BuilderSidebar'
import type { DraggedBlock, TemplateDraft } from './builderModel'
import { createDefaultBlock, insertBlock, duplicateBlockWithIds } from './builderModel'

type LinkedSectionEditorProps = {
  savedSection: SavedSectionDto
  brandColors: BrandColorDto[]
  onApplyToThisOnly: (updatedSection: EditorSection) => void
  onApplyToAll: (updatedSection: EditorSection) => void
  onCancel: () => void
}

/** Creates a minimal TemplateDraft wrapping a single section for the sub-canvas. */
function makeDraft(section: EditorSection): TemplateDraft {
  return {
    name: '',
    subject: '',
    status: 'Draft',
    mjmlBody: '',
    editorDocument: { version: 1, sections: [section] },
  }
}

export function LinkedSectionEditor({
  savedSection,
  brandColors,
  onApplyToThisOnly,
  onApplyToAll,
  onCancel,
}: LinkedSectionEditorProps) {
  const [section, setSection] = useState<EditorSection>({
    ...savedSection.sectionData,
    savedSectionId: null,
  })

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<DraggedBlock | null>(null)
  const [sectionDropTargetId, setSectionDropTargetId] = useState<string | null>(null)
  const [columnDropTargetId, setColumnDropTargetId] = useState<string | null>(null)
  const [blockDropTargetId, setBlockDropTargetId] = useState<string | null>(null)
  const [activeBuilderTab, setActiveBuilderTab] = useState<import('./builderModel').BuilderSidebarTab>('blocks')

  const draft = makeDraft(section)

  const selectedSectionObj = draft.editorDocument!.sections.find((s) => s.id === selectedSectionId) ?? null
  const selectedColumnObj = selectedSectionObj?.columns.find((c) => c.id === selectedColumnId) ?? null
  const selectedBlockObj = selectedColumnObj?.blocks.find((b) => b.id === selectedBlockId) ?? null

  function updateSection(updater: (s: EditorSection) => EditorSection) {
    setSection((prev) => updater(prev))
  }

  function handleUpdateSection(changes: Partial<EditorSection>) {
    updateSection((s) => ({ ...s, ...changes }))
  }

  function handleUpdateSelectedColumn(changes: Partial<EditorColumn>) {
    if (!selectedSectionId || !selectedColumnId) return
    updateSection((s) => ({
      ...s,
      columns: s.columns.map((c) => c.id === selectedColumnId ? { ...c, ...changes } : c),
    }))
  }

  function handleUpdateSelectedColumnWidth(_width: number | null) {
    // no-op in sub-canvas (single section — width layout not editable here)
  }

  function handleUpdateSelectedBlock(changes: Partial<EditorBlock>) {
    if (!selectedSectionId || !selectedColumnId || !selectedBlockId) return
    updateSection((s) => ({
      ...s,
      columns: s.columns.map((c) =>
        c.id === selectedColumnId
          ? { ...c, blocks: c.blocks.map((b) => b.id === selectedBlockId ? { ...b, ...changes } : b) }
          : c
      ),
    }))
  }

  function handleAddBlock(type: EditorBlockType) {
    if (!selectedSectionId || !selectedColumnId) return
    const newBlock = createDefaultBlock(type)
    updateSection((s) => ({
      ...s,
      columns: s.columns.map((c) =>
        c.id === selectedColumnId
          ? { ...c, blocks: [...c.blocks, newBlock] }
          : c
      ),
    }))
    setSelectedBlockId(newBlock.id)
  }

  function handleAddSelectedBlockItem() {
    if (!selectedBlockObj) return
    const item: EditorBlockItem = { id: crypto.randomUUID().replace(/-/g, ''), label: 'Link', url: '#' }
    handleUpdateSelectedBlock({ items: [...(selectedBlockObj.items ?? []), item] })
  }

  function handleUpdateSelectedBlockItem(itemId: string, changes: Partial<EditorBlockItem>) {
    if (!selectedBlockObj) return
    handleUpdateSelectedBlock({
      items: (selectedBlockObj.items ?? []).map((i) => i.id === itemId ? { ...i, ...changes } : i),
    })
  }

  function handleRemoveSelectedBlockItem(itemId: string) {
    if (!selectedBlockObj) return
    handleUpdateSelectedBlock({
      items: (selectedBlockObj.items ?? []).filter((i) => i.id !== itemId),
    })
  }

  function handleDuplicateBlock(_sectionId: string, columnId: string, blockId: string) {
    updateSection((s) => ({
      ...s,
      columns: s.columns.map((c) => {
        if (c.id !== columnId) return c
        const idx = c.blocks.findIndex((b) => b.id === blockId)
        if (idx === -1) return c
        const duplicate = duplicateBlockWithIds(c.blocks[idx])
        const next = [...c.blocks]
        next.splice(idx + 1, 0, duplicate)
        return { ...c, blocks: next }
      }),
    }))
  }

  function handleDeleteBlock(_sectionId: string, columnId: string, blockId: string) {
    updateSection((s) => ({
      ...s,
      columns: s.columns.map((c) =>
        c.id === columnId ? { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) } : c
      ),
    }))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  function handleBlockDragStart(sectionId: string, columnId: string, blockId: string) {
    setDraggedBlock({ source: 'canvas', sectionId, columnId, blockId })
  }

  function handlePaletteBlockDragStart(type: EditorBlockType) {
    setDraggedBlock({ source: 'palette', blockType: type })
  }

  function handleBlockDropOnColumn(_targetSectionId: string, targetColumnId: string) {
    if (!draggedBlock) return
    if (draggedBlock.source === 'palette') {
      const newBlock = createDefaultBlock(draggedBlock.blockType)
      updateSection((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === targetColumnId ? { ...c, blocks: [...c.blocks, newBlock] } : c
        ),
      }))
    } else {
      const { columnId: srcColId, blockId: srcBlockId } = draggedBlock
      updateSection((s) => {
        // Find the block to move
        const srcCol = s.columns.find((c) => c.id === srcColId)
        const blockToMove = srcCol?.blocks.find((b) => b.id === srcBlockId)
        if (!blockToMove) return s
        // Remove from source, add to target
        return {
          ...s,
          columns: s.columns.map((c) => {
            if (c.id === srcColId) return { ...c, blocks: c.blocks.filter((b) => b.id !== srcBlockId) }
            if (c.id === targetColumnId) return { ...c, blocks: insertBlock(c.blocks, blockToMove) }
            return c
          }),
        }
      })
    }
    clearDragState()
  }

  function handleBlockDropOnBlock(_targetSectionId: string, targetColumnId: string, targetBlockId: string) {
    if (!draggedBlock) return
    if (draggedBlock.source === 'palette') {
      const newBlock = createDefaultBlock(draggedBlock.blockType)
      updateSection((s) => ({
        ...s,
        columns: s.columns.map((c) => {
          if (c.id !== targetColumnId) return c
          return { ...c, blocks: insertBlock(c.blocks, newBlock, targetBlockId) }
        }),
      }))
    } else {
      const { columnId: srcColId, blockId: srcBlockId } = draggedBlock
      updateSection((s) => {
        const srcCol = s.columns.find((c) => c.id === srcColId)
        const blockToMove = srcCol?.blocks.find((b) => b.id === srcBlockId)
        if (!blockToMove) return s
        return {
          ...s,
          columns: s.columns.map((c) => {
            if (c.id === srcColId) return { ...c, blocks: c.blocks.filter((b) => b.id !== srcBlockId) }
            if (c.id === targetColumnId) return { ...c, blocks: insertBlock(c.blocks, blockToMove, targetBlockId) }
            return c
          }),
        }
      })
    }
    clearDragState()
  }

  function clearDragState() {
    setDraggedBlock(null)
    setSectionDropTargetId(null)
    setColumnDropTargetId(null)
    setBlockDropTargetId(null)
  }

  function handleSelectSection(sectionId: string) {
    setSelectedSectionId(sectionId)
    setSelectedColumnId(null)
    setSelectedBlockId(null)
  }

  function handleSelectColumn(sectionId: string, columnId: string) {
    setSelectedSectionId(sectionId)
    setSelectedColumnId(columnId)
    setSelectedBlockId(null)
  }

  function handleSelectBlock(sectionId: string, columnId: string, blockId: string) {
    setSelectedSectionId(sectionId)
    setSelectedColumnId(columnId)
    setSelectedBlockId(blockId)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Linked Section Editor</p>
          <p className="mt-0.5 text-sm font-medium text-white">{savedSection.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApplyToThisOnly(section)}
            className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20"
          >
            Apply to this template only
          </button>
          <button
            type="button"
            onClick={() => onApplyToAll(section)}
            className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Apply to all templates
          </button>
        </div>
      </div>

      {/* Sub-canvas layout */}
      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="grid h-full gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="xl:min-h-0">
            <BuilderSidebar
              draft={draft}
              activeBuilderTab={activeBuilderTab}
              setActiveBuilderTab={setActiveBuilderTab}
              selectedSection={selectedSectionObj}
              selectedColumn={selectedColumnObj}
              selectedBlock={selectedBlockObj}
              selectedSectionId={selectedSectionId}
              selectedColumnId={selectedColumnId}
              selectedBlockId={selectedBlockId}
              handleAddBlock={handleAddBlock}
              handlePaletteBlockDragStart={handlePaletteBlockDragStart}
              handleAddSection={() => { /* no new sections in sub-canvas */ }}
              handleAddPresetSection={() => { /* no presets in sub-canvas */ }}
              handleUpdateSection={handleUpdateSection}
              handleUpdateSelectedColumn={handleUpdateSelectedColumn}
              handleUpdateSelectedColumnWidth={handleUpdateSelectedColumnWidth}
              handleUpdateSelectedBlock={handleUpdateSelectedBlock}
              handleAddSelectedBlockItem={handleAddSelectedBlockItem}
              handleUpdateSelectedBlockItem={handleUpdateSelectedBlockItem}
              handleRemoveSelectedBlockItem={handleRemoveSelectedBlockItem}
              handleSelectSection={handleSelectSection}
              handleSelectColumn={handleSelectColumn}
              handleSelectBlock={handleSelectBlock}
              handleStartBuilder={() => { /* no-op */ }}
              clearDragState={clearDragState}
              brandColors={brandColors}
              savedSections={[]}
              onInsertSavedSection={() => { /* no nesting */ }}
              onDeleteSavedSection={() => { /* no-op */ }}
            />
          </div>
          <div className="xl:min-h-0 xl:overflow-y-auto xl:pr-2">
            <BuilderCanvas
              draft={draft}
              selectedSectionId={selectedSectionId}
              selectedColumnId={selectedColumnId}
              selectedBlockId={selectedBlockId}
              draggedSectionId={null}
              draggedBlock={draggedBlock}
              sectionDropTargetId={sectionDropTargetId}
              columnDropTargetId={columnDropTargetId}
              blockDropTargetId={blockDropTargetId}
              handleSelectSection={handleSelectSection}
              handleSelectColumn={handleSelectColumn}
              handleSelectBlock={handleSelectBlock}
              handleSectionDragStart={() => { /* no section reorder in sub-canvas */ }}
              handleSectionDrop={() => { /* no-op */ }}
              handleBlockDragStart={handleBlockDragStart}
              handleBlockDropOnColumn={handleBlockDropOnColumn}
              handleBlockDropOnBlock={handleBlockDropOnBlock}
              setSectionDropTargetId={setSectionDropTargetId}
              setColumnDropTargetId={setColumnDropTargetId}
              setBlockDropTargetId={setBlockDropTargetId}
              clearDragState={clearDragState}
              handleStartBuilder={() => { /* no-op */ }}
              handleAddSection={() => { /* no-op */ }}
              handleDuplicateSection={() => { /* no-op */ }}
              handleDeleteSection={() => { /* no-op */ }}
              handleDuplicateBlock={handleDuplicateBlock}
              handleDeleteBlock={handleDeleteBlock}
              canUndo={false}
              canRedo={false}
              handleUndo={() => { /* no-op */ }}
              handleRedo={() => { /* no-op */ }}
              handleUpdateSelectedBlock={handleUpdateSelectedBlock}
              isSubCanvas
            />
          </div>
        </div>
      </div>
    </div>
  )
}
