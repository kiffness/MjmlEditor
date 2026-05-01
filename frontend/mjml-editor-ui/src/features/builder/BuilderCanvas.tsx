import type { EditorBlock } from '../../lib/api'
import {
  type BuilderPreset,
  type DraggedBlock,
  type TemplateDraft,
  getBlockActionPlacement,
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
                  draggable
                  onDragStart={() => handleSectionDragStart(section.id)}
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
                  onClick={() => handleSelectSection(section.id)}
                  className={`block w-full rounded-[28px] border p-5 text-left transition ${
                    isSectionDropTarget
                      ? 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                      : isSectionSelected
                        ? 'border-sky-400/60 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                        : 'border-white/10 bg-white hover:border-white/20'
                  } ${draggedSectionId === section.id ? 'opacity-60' : ''}`}
                >
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
                      {isSectionSelected && (
                        <>
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
  const actionPlacement = getBlockActionPlacement(block)

  function renderActionChip(inverse = false) {
    if (!block.actionLabel && !block.actionUrl) {
      return null
    }

    return (
      <div className="flex" style={{ justifyContent: toFlexJustify(block.alignment) }}>
        <span
          className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${inverse ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'}`}
        >
          {block.actionLabel || 'Learn more'}
        </span>
      </div>
    )
  }

  if (block.type === 'Hero') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heading</p>
        {isSelected ? (
          <div className="mt-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Heading" onChange={(value) => onUpdateBlock({ textContent: value })} />
          </div>
        ) : (
          <p className="mt-2" style={getBlockTextStyle(block, { color: '#1f2937', fontSize: 24, fontWeight: '700' })}>
            {block.textContent}
          </p>
        )}
      </div>
    )
  }

  if (block.type === 'Text') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paragraph</p>
        {isSelected ? (
          <div className="mt-3">
            <InlineCanvasInput multiline value={block.textContent ?? ''} placeholder="Paragraph copy" onChange={(value) => onUpdateBlock({ textContent: value })} />
          </div>
        ) : (
          <p className="mt-2" style={getBlockTextStyle(block, { color: '#475569', fontSize: 16 })}>
            {block.textContent}
          </p>
        )}
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

  if (block.type === 'PropertyCard') {
    const action = renderActionChip()
    const details = (
      <div className="min-w-0 flex-1">
        {actionPlacement === 'BeforeContent' && action && <div className="mb-4">{action}</div>}
        {isSelected ? (
          <div className="space-y-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Property title" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput value={block.secondaryText ?? ''} placeholder="Property details" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
            <InlineCanvasInput value={block.actionLabel ?? ''} placeholder="Button label" onChange={(value) => onUpdateBlock({ actionLabel: value })} />
          </div>
        ) : (
          <>
            <p style={getBlockTextStyle(block, { color: '#0f172a', fontSize: 20, fontWeight: '700' })}>
              {block.textContent || 'Property title'}
            </p>
            {block.secondaryText && (
              <p className="mt-2 text-sm text-slate-500">{block.secondaryText}</p>
            )}
          </>
        )}
        {actionPlacement === 'AfterContent' && action && <div className="mt-4">{action}</div>}
      </div>
    )
    const media = (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {block.imageUrl ? (
          <img
            src={block.imageUrl}
            alt={block.altText ?? 'Featured property'}
            className={layout === 'Vertical' ? 'h-40 w-full object-cover' : 'h-full min-h-48 w-full object-cover'}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">No property image</div>
        )}
      </div>
    )

    return (
      <div
        className="overflow-hidden rounded-3xl"
        style={{
          backgroundColor: block.backgroundColor ?? '#ffffff',
          borderColor: block.borderColor ?? '#dbe4f0',
          borderWidth: block.borderWidth ?? 1,
          borderStyle: 'solid',
          borderRadius: block.borderRadius ?? 20,
        }}
      >
        <p className="px-5 pt-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Property card</p>
        <div className={`px-5 pb-5 pt-3 ${layout === 'Vertical' ? 'space-y-4' : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4'}`}>
          {layout === 'HorizontalReverse'
            ? <>{details}{media}</>
            : layout === 'Horizontal'
              ? <>{media}{details}</>
              : <><div>{media}</div>{details}</>}
        </div>
      </div>
    )
  }

  if (block.type === 'FeatureCard') {
    return (
      <div
        className="rounded-3xl px-5 py-5"
        style={{
          backgroundColor: block.backgroundColor ?? '#eff6ff',
          borderColor: block.borderColor ?? '#bfdbfe',
          borderWidth: block.borderWidth ?? 1,
          borderStyle: 'solid',
          borderRadius: block.borderRadius ?? 18,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Feature card</p>
        {isSelected ? (
          <div className="mt-3 space-y-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Feature title" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput value={block.secondaryText ?? ''} placeholder="Feature detail" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
          </div>
        ) : layout === 'Vertical' ? (
          <>
            <p className="mt-3" style={getBlockTextStyle(block, { color: '#1d4ed8', fontSize: 18, fontWeight: '700' })}>
              {block.textContent || 'Feature title'}
            </p>
            {block.secondaryText && <p className="mt-2 text-sm text-slate-600">{block.secondaryText}</p>}
          </>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {layout === 'HorizontalReverse'
              ? <><p className="text-sm text-slate-600">{block.secondaryText}</p><p style={getBlockTextStyle(block, { color: '#1d4ed8', fontSize: 18, fontWeight: '700' })}>{block.textContent || 'Feature title'}</p></>
              : <><p style={getBlockTextStyle(block, { color: '#1d4ed8', fontSize: 18, fontWeight: '700' })}>{block.textContent || 'Feature title'}</p><p className="text-sm text-slate-600">{block.secondaryText}</p></>}
          </div>
        )}
      </div>
    )
  }

  if (block.type === 'IconText') {
    const media = (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        {block.imageUrl ? (
          <img src={block.imageUrl} alt={block.altText ?? 'Feature icon'} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-slate-500">Icon</span>
        )}
      </div>
    )
    const content = (
      <div className="min-w-0 flex-1">
        {isSelected ? (
          <div className="space-y-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Amenity title" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput multiline value={block.secondaryText ?? ''} placeholder="Amenity detail" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
          </div>
        ) : (
          <>
            <p style={getBlockTextStyle(block, { color: '#0f172a', fontSize: 16, fontWeight: '700' })}>
              {block.textContent || 'Amenity title'}
            </p>
            {block.secondaryText && <p className="mt-1 text-sm text-slate-500">{block.secondaryText}</p>}
          </>
        )}
      </div>
    )

    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Icon + text</p>
        <div className={`mt-3 ${layout === 'Vertical' ? 'space-y-3' : 'flex items-start gap-4'}`}>
          {layout === 'HorizontalReverse'
            ? <>{content}{media}</>
            : layout === 'Horizontal'
              ? <>{media}{content}</>
              : <><div>{media}</div>{content}</>}
        </div>
      </div>
    )
  }

  if (block.type === 'PromoBanner') {
    const action = renderActionChip(true)
    const copy = (
      <div className="min-w-0 flex-1">
        {isSelected ? (
          <div className="space-y-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Promotion headline" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput value={block.secondaryText ?? ''} placeholder="Promotion detail" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
            <InlineCanvasInput value={block.actionLabel ?? ''} placeholder="CTA label" onChange={(value) => onUpdateBlock({ actionLabel: value })} />
          </div>
        ) : (
          <>
            <p style={getBlockTextStyle(block, { color: '#ffffff', fontSize: 20, fontWeight: '700' })}>
              {block.textContent || 'Promotion headline'}
            </p>
            {block.secondaryText && <p className="mt-2 text-sm text-slate-300">{block.secondaryText}</p>}
          </>
        )}
      </div>
    )

    return (
      <div
        className="rounded-3xl px-5 py-5"
        style={{
          backgroundColor: block.backgroundColor ?? '#0f172a',
          borderColor: block.borderColor ?? undefined,
          borderWidth: block.borderWidth ?? undefined,
          borderStyle: block.borderWidth ? 'solid' : undefined,
          borderRadius: block.borderRadius ?? 20,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Promo banner</p>
        {layout === 'Vertical' ? (
          <div className="mt-3 space-y-4">
            {actionPlacement === 'BeforeContent' && action}
            {copy}
            {actionPlacement === 'AfterContent' && action}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            {layout === 'HorizontalReverse'
              ? <>{action}{copy}</>
              : <>{copy}{action}</>}
          </div>
        )}
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
        {isSelected ? (
          <div className="mt-3">
            <InlineCanvasInput value={block.textContent ?? ''} placeholder="Badge text" onChange={(value) => onUpdateBlock({ textContent: value })} />
          </div>
        ) : (
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
            >
              {block.textContent || 'Badge'}
            </span>
          </div>
        )}
      </div>
    )
  }

  if (block.type === 'Quote') {
    return (
      <div style={frameStyle} className="rounded-2xl px-1 py-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quote</p>
        {isSelected ? (
          <div className="mt-3 space-y-3">
            <InlineCanvasInput multiline value={block.textContent ?? ''} placeholder="Quote" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput value={block.secondaryText ?? ''} placeholder="Attribution" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
          </div>
        ) : (
          <>
            <blockquote
              className="mt-2 border-l-2 border-slate-200 pl-4 italic"
              style={getBlockTextStyle(block, { color: '#334155', fontSize: 18 })}
            >
              “{block.textContent}”
            </blockquote>
            {block.secondaryText && <p className="mt-2 text-sm text-slate-500">{block.secondaryText}</p>}
          </>
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
        {isSelected ? (
          <div className="mt-3 space-y-3">
            <InlineCanvasInput multiline value={block.textContent ?? ''} placeholder="Footer copy" onChange={(value) => onUpdateBlock({ textContent: value })} />
            <InlineCanvasInput value={block.secondaryText ?? ''} placeholder="Secondary line" onChange={(value) => onUpdateBlock({ secondaryText: value })} />
          </div>
        ) : (
          <>
            <p className="mt-2" style={getBlockTextStyle(block, { color: '#64748b', fontSize: 12 })}>{block.textContent}</p>
            {block.secondaryText && <p className="mt-1 text-xs text-slate-400">{block.secondaryText}</p>}
          </>
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
