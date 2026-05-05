import type { EditorBlock } from '../../lib/api'
import DOMPurify from 'dompurify'
import {
  type BuilderPreset,
  type DraggedBlock,
  type TemplateDraft,
  getBlockFrameStyle,
  getBlockLayout,
  getBlockTextStyle,
  isCanvasDraggedBlock,
  toColumnJustify,
  toFlexJustify,
} from './builderModel'

function CanvasActionButton({
  label,
  tone = 'default',
  onClick,
}: {
  label: string
  tone?: 'default' | 'danger'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={`rounded-xl border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
        tone === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function InlineCanvasInput({
  value,
  placeholder,
  multiline = false,
  onChange,
}: {
  value: string
  placeholder: string
  multiline?: boolean
  onChange: (value: string) => void
}) {
  const sharedClassName = 'w-full rounded-xl border border-sky-200 bg-white/95 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20'

  if (multiline) {
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
        className={`${sharedClassName} min-h-[84px] resize-y`}
      />
    )
  }

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      className={sharedClassName}
    />
  )
}

const BLOCK_PURIFY_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'u', 'a', 'br', 'p', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
}
const INLINE_PURIFY_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'u', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
}

function safeHtml(html: string | null | undefined, inline = false): string {
  return DOMPurify.sanitize(html ?? '', inline ? INLINE_PURIFY_CONFIG : BLOCK_PURIFY_CONFIG) as string
}

type BuilderCanvasProps = {
  draft: TemplateDraft
  selectedSectionId: string | null
  selectedColumnId: string | null
  selectedBlockId: string | null
  draggedSectionId: string | null
  draggedBlock: DraggedBlock | null
  sectionDropTargetId: string | null
  columnDropTargetId: string | null
  blockDropTargetId: string | null
  handleSelectSection: (sectionId: string) => void
  handleSelectColumn: (sectionId: string, columnId: string) => void
  handleSelectBlock: (sectionId: string, columnId: string, blockId: string) => void
  handleSectionDragStart: (sectionId: string) => void
  handleSectionDrop: (targetSectionId: string) => void
  handleBlockDragStart: (sectionId: string, columnId: string, blockId: string) => void
  handleBlockDropOnColumn: (targetSectionId: string, targetColumnId: string) => void
  handleBlockDropOnBlock: (targetSectionId: string, targetColumnId: string, targetBlockId: string) => void
  setSectionDropTargetId: (sectionId: string | null) => void
  setColumnDropTargetId: (columnId: string | null) => void
  setBlockDropTargetId: (blockId: string | null) => void
  clearDragState: () => void
  handleStartBuilder: (preset?: BuilderPreset) => void
  handleAddSection: (columnCount: number) => void
  handleDuplicateSection: (sectionId: string) => void
  handleDeleteSection: (sectionId: string) => void
  handleDuplicateBlock: (sectionId: string, columnId: string, blockId: string) => void
  handleDeleteBlock: (sectionId: string, columnId: string, blockId: string) => void
  canUndo: boolean
  canRedo: boolean
  handleUndo: () => void
  handleRedo: () => void
  handleUpdateSelectedBlock: (changes: Partial<EditorBlock>) => void
  /** When true, hides section reorder/add controls (used in the LinkedSectionEditor sub-canvas). */
  isSubCanvas?: boolean
  /** Called when the user chooses "Save to library" from the section context menu. */
  handleSaveSection?: (sectionId: string) => void
  /** Called when the user clicks "Edit Linked Section" on a linked section. */
  onEditLinkedSection?: (sectionId: string) => void
}

export function BuilderCanvas({
  draft,
  selectedSectionId,
  selectedColumnId,
  selectedBlockId,
  draggedSectionId,
  draggedBlock,
  sectionDropTargetId,
  columnDropTargetId,
  blockDropTargetId,
  handleSelectSection,
  handleSelectColumn,
  handleSelectBlock,
  handleSectionDragStart,
  handleSectionDrop,
  handleBlockDragStart,
  handleBlockDropOnColumn,
  handleBlockDropOnBlock,
  setSectionDropTargetId,
  setColumnDropTargetId,
  setBlockDropTargetId,
  clearDragState,
  handleStartBuilder,
  handleAddSection,
  handleDuplicateSection,
  handleDeleteSection,
  handleDuplicateBlock,
  handleDeleteBlock,
  canUndo,
  canRedo,
  handleUndo,
  handleRedo,
  handleUpdateSelectedBlock,
  isSubCanvas = false,
  handleSaveSection,
  onEditLinkedSection,
}: BuilderCanvasProps) {
  if (!draft.editorDocument) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
        <div className="flex h-full min-h-[720px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-slate-950/40 px-8 text-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Builder canvas</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start a visual layout</h2>
            <p className="mt-3 text-sm text-slate-400">
              This template is still MJML-only. Choose a preset or section layout to start a structured builder draft on this dedicated page.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => handleStartBuilder('hero')}
                className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Start with hero preset
              </button>
              <button
                type="button"
                onClick={() => handleAddSection(1)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
              >
                Start blank section
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Builder canvas
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Select sections and blocks on the canvas, drag existing content to reorder it, and drag block cards from the sidebar straight into place.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {draft.editorDocument.sections.length} section{draft.editorDocument.sections.length === 1 ? '' : 's'}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
          >
            Redo
          </button>
        </div>
      </div>

      <div className="mt-6 min-h-[720px] rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
        <div className="mx-auto max-w-[600px] space-y-5">
          {draft.editorDocument.sections.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/30 px-8 py-16 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Empty builder</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Add a section to start laying out the email</h3>
              <p className="mt-3 text-sm text-slate-400">
                Delete now leaves the builder cleanly empty. Add a blank section or restart from a preset whenever you want.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAddSection(1)}
                  className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  Add blank section
                </button>
                <button
                  type="button"
                  onClick={() => handleStartBuilder('hero')}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                >
                  Reload starter preset
                </button>
              </div>
            </div>
          ) : draft.editorDocument.sections.map((section, sectionIndex) => {
            const isSectionSelected = section.id === selectedSectionId
            const isSectionDropTarget = sectionDropTargetId === section.id && draggedSectionId !== section.id
            const isLinked = !!section.savedSectionId

            return (
              <div key={section.id} className="space-y-2">
                {isSectionDropTarget && (
                  <div className="flex items-center gap-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                    <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                    Move section here
                    <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                  </div>
                )}

                <div
                  draggable={!isLinked}
                  onDragStart={() => !isLinked && handleSectionDragStart(section.id)}
                  onDragOver={(event) => {
                    if (!draggedSectionId || draggedSectionId === section.id) {
                      return
                    }

                    event.preventDefault()
                    setSectionDropTargetId(section.id)
                  }}
                  onDragLeave={() => {
                    if (sectionDropTargetId === section.id) {
                      setSectionDropTargetId(null)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    handleSectionDrop(section.id)
                  }}
                  onDragEnd={clearDragState}
                  onClick={() => !isLinked && handleSelectSection(section.id)}
                  className={`relative block w-full rounded-[28px] border p-5 text-left transition ${
                    isSectionDropTarget
                      ? 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                      : isSectionSelected
                        ? 'border-sky-400/60 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                        : isLinked
                          ? 'border-violet-400/40 bg-violet-500/5 hover:border-violet-400/60'
                          : 'border-white/10 bg-white hover:border-white/20'
                  } ${draggedSectionId === section.id ? 'opacity-60' : ''}`}
                >
                  {/* Linked section overlay */}
                  {isLinked && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-slate-950/30 backdrop-blur-[1px]">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                          </svg>
                          Linked section
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditLinkedSection?.(section.id)
                          }}
                          className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                        >
                          Edit Linked Section
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Section {sectionIndex + 1}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {section.columns.length} column{section.columns.length === 1 ? '' : 's'} · padding {section.padding ?? 24}px
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSectionSelected && !isLinked && (
                        <>
                          {!isSubCanvas && handleSaveSection && (
                            <CanvasActionButton label="Save to library" onClick={() => handleSaveSection(section.id)} />
                          )}
                          <CanvasActionButton label="Duplicate" onClick={() => handleDuplicateSection(section.id)} />
                          <CanvasActionButton label="Delete" tone="danger" onClick={() => handleDeleteSection(section.id)} />
                        </>
                      )}
                      <div
                        className="h-5 w-5 rounded-full border border-slate-300"
                        style={{ backgroundColor: section.backgroundColor ?? '#ffffff' }}
                      />
                    </div>
                  </div>

                  <div
                    className="mt-5 grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr))` }}
                  >
                    {section.columns.map((column) => {
                      const isColumnDropTarget = blockDropTargetId === null && columnDropTargetId === column.id && draggedBlock !== null

                      return (
                        <div
                          key={column.id}
                          onDragOver={(event) => {
                            if (!draggedBlock) {
                              return
                            }

                            event.preventDefault()
                            setColumnDropTargetId(column.id)
                            setBlockDropTargetId(null)
                          }}
                          onDragLeave={() => {
                            if (columnDropTargetId === column.id) {
                              setColumnDropTargetId(null)
                            }
                          }}
                          onDrop={(event) => {
                            if (!draggedBlock) {
                              return
                            }

                            event.preventDefault()
                            handleBlockDropOnColumn(section.id, column.id)
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleSelectColumn(section.id, column.id)
                          }}
                          className={`space-y-3 rounded-3xl border p-4 text-left transition ${
                            isColumnDropTarget
                              ? 'border-amber-400/60 bg-amber-50 shadow-sm shadow-amber-200/70'
                              : selectedColumnId === column.id
                                ? 'border-sky-400/60 bg-sky-50 shadow-sm shadow-sky-200/70'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: column.backgroundColor ?? undefined,
                            justifyContent: toColumnJustify(column.verticalAlignment),
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            <span>{column.widthPercentage}% width</span>
                            <span>{column.verticalAlignment ?? 'Top'}</span>
                          </div>
                          {column.blocks.length === 0 ? (
                            <div className={`rounded-2xl border border-dashed px-4 py-8 text-center text-sm ${
                              isColumnDropTarget
                                ? 'border-amber-400/60 bg-amber-50/80 text-amber-700'
                                : 'border-slate-300 text-slate-500'
                            }`}>
                              {isColumnDropTarget ? 'Drop block here' : 'Empty column'}
                              <span className="mt-2 block text-xs text-slate-400">
                                {isColumnDropTarget
                                  ? 'Release to add the block to this column.'
                                  : 'Select this column, then add a block from the sidebar.'}
                              </span>
                            </div>
                          ) : (
                            <>
                              {column.blocks.map((block) => {
                                const isBlockSelected = selectedBlockId === block.id
                                const isBlockDropTarget = blockDropTargetId === block.id

                                return (
                                  <div key={block.id} className="space-y-2">
                                    {isBlockDropTarget && (
                                      <div className="flex items-center gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500">
                                        <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                                        Insert here
                                        <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                                      </div>
                                    )}
                                    <div
                                      draggable
                                      onDragStart={(event) => {
                                        event.stopPropagation()
                                        handleBlockDragStart(section.id, column.id, block.id)
                                      }}
                                      onDragOver={(event) => {
                                        if (!draggedBlock || (isCanvasDraggedBlock(draggedBlock) && draggedBlock.blockId === block.id)) {
                                          return
                                        }

                                        event.preventDefault()
                                        event.stopPropagation()
                                        setColumnDropTargetId(null)
                                        setBlockDropTargetId(block.id)
                                      }}
                                      onDragLeave={() => {
                                        if (blockDropTargetId === block.id) {
                                          setBlockDropTargetId(null)
                                        }
                                      }}
                                      onDrop={(event) => {
                                        if (!draggedBlock) {
                                          return
                                        }

                                        event.preventDefault()
                                        event.stopPropagation()
                                        handleBlockDropOnBlock(section.id, column.id, block.id)
                                      }}
                                      onDragEnd={clearDragState}
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handleSelectBlock(section.id, column.id, block.id)
                                      }}
                                      className={`block w-full rounded-2xl border p-4 text-left transition ${
                                        isBlockDropTarget && !(isCanvasDraggedBlock(draggedBlock) && draggedBlock.blockId === block.id)
                                          ? 'border-amber-400/60 bg-amber-50 shadow-sm shadow-amber-200/70'
                                          : isBlockSelected
                                            ? 'border-sky-400/60 bg-sky-50 shadow-sm shadow-sky-200/70'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                      } ${isCanvasDraggedBlock(draggedBlock) && draggedBlock.blockId === block.id ? 'opacity-60' : ''}`}
                                    >
                                      {isBlockSelected && (
                                        <div className="mb-3 flex justify-end gap-2">
                                          <CanvasActionButton label="Duplicate" onClick={() => handleDuplicateBlock(section.id, column.id, block.id)} />
                                          <CanvasActionButton label="Delete" tone="danger" onClick={() => handleDeleteBlock(section.id, column.id, block.id)} />
                                        </div>
                                      )}
                                      <CanvasBlockPreview block={block} isSelected={isBlockSelected} onUpdateBlock={handleUpdateSelectedBlock} />
                                    </div>
                                  </div>
                                )
                              })}

                              {isColumnDropTarget && (
                                <div className="flex items-center gap-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500">
                                  <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                                  Drop at end of column
                                  <div className="h-0.5 flex-1 rounded-full bg-amber-400" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CanvasBlockPreview({
  block,
  isSelected,
  onUpdateBlock,
}: {
  block: EditorBlock
  isSelected: boolean
  onUpdateBlock: (changes: Partial<EditorBlock>) => void
}) {
  const frameStyle = getBlockFrameStyle(block)
  const contentWidth = block.widthPercentage ? `${block.widthPercentage}%` : '100%'
  const explicitContentWidth = block.widthPercentage !== null && block.widthPercentage !== undefined
    ? `${block.widthPercentage}%`
    : undefined
  const explicitButtonPreviewMaxWidth = block.widthPercentage !== null && block.widthPercentage !== undefined
    ? `${Math.round(552 * (block.widthPercentage / 100))}px`
    : undefined
  const layout = getBlockLayout(block)

  if (block.type === 'Hero') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heading</p>
        <div
          className="mt-2"
          style={getBlockTextStyle(block, { color: '#1f2937', fontSize: 24, fontWeight: '700' })}
          dangerouslySetInnerHTML={{ __html: safeHtml(block.textContent) }}
        />
      </div>
    )
  }

  if (block.type === 'Text') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paragraph</p>
        <div
          className="mt-2"
          style={getBlockTextStyle(block, { color: '#475569', fontSize: 16 })}
          dangerouslySetInnerHTML={{ __html: safeHtml(block.textContent) }}
        />
      </div>
    )
  }

  if (block.type === 'Image') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Image</p>
        <div
          className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
          style={{
            width: contentWidth,
            marginLeft: block.alignment === 'Center' || block.alignment === 'Right' ? 'auto' : undefined,
            marginRight: block.alignment === 'Left' || block.alignment === 'Center' ? 'auto' : undefined,
          }}
        >
          {block.imageUrl ? (
            <img src={block.imageUrl} alt={block.altText ?? 'Campaign visual'} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-sm text-slate-500">No image URL</div>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'Logo') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Logo</p>
        <div
          className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 px-4 py-6"
          style={{
            width: contentWidth,
            marginLeft: block.alignment === 'Center' || block.alignment === 'Right' ? 'auto' : undefined,
            marginRight: block.alignment === 'Left' || block.alignment === 'Center' ? 'auto' : undefined,
          }}
        >
          {block.imageUrl ? (
            <img src={block.imageUrl} alt={block.altText ?? 'Brand logo'} className="mx-auto h-16 max-w-[180px] object-contain" />
          ) : (
            <div className="flex h-16 items-center justify-center text-sm text-slate-500">No logo URL</div>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'Button') {
    // Don't apply frameStyle here — backgroundColor/border are button-specific and must
    // only appear on the button element itself, not the full-width frame container.
    return (
      <div className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Button</p>
        {isSelected ? (
          <div className="mt-3">
            <InlineCanvasInput value={block.actionLabel ?? ''} placeholder="Button label" onChange={(value) => onUpdateBlock({ actionLabel: value })} />
          </div>
        ) : (
          <div className="mt-3 flex" style={{ justifyContent: toFlexJustify(block.alignment) }}>
            <span
              data-testid={`builder-button-preview-${block.id}`}
              className="inline-flex px-4 py-2 text-sm"
              style={{
                backgroundColor: block.backgroundColor ?? '#2563eb',
                borderRadius: block.borderRadius ?? undefined,
                borderColor: block.borderColor ?? undefined,
                borderWidth: block.borderWidth ?? undefined,
                borderStyle: block.borderWidth ? 'solid' : undefined,
                width: explicitContentWidth,
                maxWidth: explicitButtonPreviewMaxWidth,
                justifyContent: 'center',
                ...getBlockTextStyle(block, { color: '#ffffff', fontSize: 14, fontWeight: '600' }),
              }}
            >
              {block.actionLabel || 'Button'}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (block.type === 'Badge') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Badge</p>
        <div className="mt-3 flex" style={{ justifyContent: toFlexJustify(block.alignment) }}>
          <span
            className="inline-flex px-3 py-1 text-xs"
            style={{
              backgroundColor: block.backgroundColor ?? '#dbeafe',
              borderRadius: block.borderRadius ?? 999,
              borderColor: block.borderColor ?? undefined,
              borderWidth: block.borderWidth ?? undefined,
              borderStyle: block.borderWidth ? 'solid' : undefined,
              ...getBlockTextStyle(block, { color: '#1d4ed8', fontSize: 13, fontWeight: '600' }),
            }}
            dangerouslySetInnerHTML={{ __html: safeHtml(block.textContent, true) || 'Badge' }}
          />
        </div>
      </div>
    )
  }

  if (block.type === 'Quote') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quote</p>
        <blockquote
          className="mt-2 border-l-2 border-slate-200 pl-4 italic"
          style={getBlockTextStyle(block, { color: '#334155', fontSize: 18 })}
          dangerouslySetInnerHTML={{ __html: `"${safeHtml(block.textContent, true)}"` }}
        />
        {block.secondaryText && (
          <p
            className="mt-2 text-sm text-slate-500"
            dangerouslySetInnerHTML={{ __html: safeHtml(block.secondaryText, true) }}
          />
        )}
      </div>
    )
  }
  if (block.type === 'LinkList') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Link list</p>
        <div
          className={layout === 'Vertical' ? 'mt-3 space-y-2 text-sm font-medium' : 'mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium'}
          style={layout === 'Vertical' ? undefined : { justifyContent: toFlexJustify(block.alignment) }}
        >
          {(block.items ?? []).map((item) => (
            <div key={item.id} style={getBlockTextStyle(block, { color: '#2563eb', fontSize: 14, fontWeight: '600' })}>{item.label}</div>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'SocialLinks') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Social links</p>
        <div
          className={layout === 'Vertical' ? 'mt-3 space-y-2' : 'mt-3 flex flex-wrap gap-2'}
          style={layout === 'Vertical' ? undefined : { justifyContent: toFlexJustify(block.alignment) }}
        >
          {(block.items ?? []).map((item) => (
            <span
              key={item.id}
              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs"
              style={getBlockTextStyle(block, { color: '#2563eb', fontSize: 14, fontWeight: '600' })}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (block.type === 'Footer') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Footer / legal</p>
        <div
          className="mt-2"
          style={getBlockTextStyle(block, { color: '#64748b', fontSize: 12 })}
          dangerouslySetInnerHTML={{ __html: safeHtml(block.textContent) }}
        />
        {block.secondaryText && (
          <p
            className="mt-1 text-xs text-slate-400"
            dangerouslySetInnerHTML={{ __html: safeHtml(block.secondaryText, true) }}
          />
        )}
      </div>
    )
  }

    if (block.type === 'Spacer') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Spacer</p>
        <div className="mt-3 rounded-full border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500" style={{ height: `${block.spacing ?? 24}px`, lineHeight: `${block.spacing ?? 24}px` }}>
          {block.spacing ?? 24}px
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Divider</p>
      <div
        className="mt-4"
        style={{
          borderTop: `${block.dividerThickness ?? 1}px solid ${block.dividerColor ?? '#d1d5db'}`,
        }}
      />
    </div>
  )
}
