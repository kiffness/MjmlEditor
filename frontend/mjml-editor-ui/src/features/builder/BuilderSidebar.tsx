import type {
  EditorAlignment,
  EditorBlock,
  EditorBlockItem,
  EditorBlockType,
  EditorColumn,
  EditorSection,
  EditorTextDecoration,
  EditorTextTransform,
  EditorVerticalAlignment,
} from '../../lib/api'
import {
  builderBlockPalette,
  builderPresetOptions,
  builderSectionOptions,
  builderTabs,
  columnVerticalAlignmentOptions,
  fontFamilyOptions,
  fontWeightOptions,
  textDecorationOptions,
  textTransformOptions,
  toBlockLabel,
  toOptionalNumber,
  toOptionalText,
  type BuilderPreset,
  type BuilderSidebarTab,
  type TemplateDraft,
} from './builderModel'

type BlockItemsEditorProps = {
  items: EditorBlockItem[]
  title: string
  addLabel: string
  onAdd: () => void
  onChange: (itemId: string, changes: Partial<EditorBlockItem>) => void
  onRemove: (itemId: string) => void
}

function BlockItemsEditor({ items, title, addLabel, onAdd, onChange, onRemove }: BlockItemsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
        >
          {addLabel}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
            <div className="grid gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Label
                </span>
                <input
                  type="text"
                  value={item.label}
                  onChange={(event) => onChange(item.id, { label: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  URL
                </span>
                <input
                  type="text"
                  value={item.url}
                  onChange={(event) => onChange(item.id, { url: event.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                disabled={items.length <= 1}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BlockPaletteIcon({ type }: { type: EditorBlockType }) {
  const stroke = 'currentColor'

  switch (type) {
    case 'Hero':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M5 6h14M5 12h10M5 18h14" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Text':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M5 7h14M5 11h14M5 15h10M5 19h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Image':
    case 'Logo':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.5" stroke={stroke} strokeWidth="1.8" />
          <circle cx="9" cy="10" r="1.4" fill={stroke} />
          <path d="M7 16l3.2-3 2.3 2 3.5-4 2 5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'PropertyCard':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.5" stroke={stroke} strokeWidth="1.8" />
          <path d="M7 10.5h10M7 14.5h7" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 8l2.2 2.2L12 7.5l5 5.5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'FeatureCard':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="3" stroke={stroke} strokeWidth="1.8" />
          <path d="M9 10h6M8 14.5h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'IconText':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <circle cx="8" cy="12" r="3" stroke={stroke} strokeWidth="1.8" />
          <path d="M13 9h6M13 12h6M13 15h4" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'PromoBanner':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M5 8h14v8H5z" stroke={stroke} strokeWidth="1.8" />
          <path d="M8 12h8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Button':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="4" y="7" width="16" height="10" rx="5" stroke={stroke} strokeWidth="1.8" />
          <path d="M9 12h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Badge':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="5" y="7" width="14" height="10" rx="5" stroke={stroke} strokeWidth="1.8" />
          <path d="M9 12h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Quote':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M8.5 10.5H6.8A2.8 2.8 0 0 1 9.6 7.7M17.2 10.5h-1.7a2.8 2.8 0 0 1 2.8-2.8M6.8 10.5h3v5h-5v-2.8a2.2 2.2 0 0 1 2-2.2ZM15.5 10.5h3v5h-5v-2.8a2.2 2.2 0 0 1 2-2.2Z" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'LinkList':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M7 7h10M7 12h10M7 17h10" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="5" cy="7" r="1" fill={stroke} />
          <circle cx="5" cy="12" r="1" fill={stroke} />
          <circle cx="5" cy="17" r="1" fill={stroke} />
        </svg>
      )
    case 'SocialLinks':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <circle cx="6.5" cy="12" r="2.5" stroke={stroke} strokeWidth="1.8" />
          <circle cx="17.5" cy="7" r="2.5" stroke={stroke} strokeWidth="1.8" />
          <circle cx="17.5" cy="17" r="2.5" stroke={stroke} strokeWidth="1.8" />
          <path d="M8.8 10.9l6.4-2.8M8.8 13.1l6.4 2.8" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Footer':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M5 8h14M5 12h14M5 16h9" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'Spacer':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M12 5v14M8.5 8.5L12 5l3.5 3.5M8.5 15.5L12 19l3.5-3.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'Divider':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M4 12h16" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}

function SectionLayoutIcon({ columns }: { columns: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      {Array.from({ length: Math.max(1, Math.min(columns, 6)) - 1 }, (_, index) => {
        const x = 4 + ((16 / columns) * (index + 1))
        return (
          <path
            key={x}
            d={`M${x} 6v12`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

function PresetPaletteIcon({ preset }: { preset: BuilderPreset }) {
  switch (preset) {
    case 'hero':
      return <SectionLayoutIcon columns={1} />
    case 'announcement':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="5" y="6" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'image-left-text-right':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <rect x="4" y="6" width="7" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M14 9h6M14 13h6M14 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'image-right-text-left':
      return (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path d="M4 9h6M4 13h6M4 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="13" y="6" width="7" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    case 'three-up-features':
      return <SectionLayoutIcon columns={3} />
  }
}

type BuilderSidebarProps = {
  draft: TemplateDraft
  activeBuilderTab: BuilderSidebarTab
  setActiveBuilderTab: (tab: BuilderSidebarTab) => void
  selectedSection: EditorSection | null
  selectedColumn: EditorColumn | null
  selectedBlock: EditorBlock | null
  selectedSectionId: string | null
  selectedColumnId: string | null
  handleAddBlock: (type: EditorBlockType) => void
  handlePaletteBlockDragStart: (type: EditorBlockType) => void
  handleAddSection: (columnCount: number) => void
  handleAddPresetSection: (preset: BuilderPreset) => void
  handleUpdateSection: (changes: Partial<EditorSection>) => void
  handleUpdateSelectedColumn: (changes: Partial<EditorColumn>) => void
  handleUpdateSelectedColumnWidth: (width: number | null) => void
  handleUpdateSelectedBlock: (changes: Partial<EditorBlock>) => void
  handleAddSelectedBlockItem: () => void
  handleUpdateSelectedBlockItem: (itemId: string, changes: Partial<EditorBlockItem>) => void
  handleRemoveSelectedBlockItem: (itemId: string) => void
  handleSelectSection: (sectionId: string) => void
  handleSelectColumn: (sectionId: string, columnId: string) => void
  handleStartBuilder: (preset?: BuilderPreset) => void
  clearDragState: () => void
}

export function BuilderSidebar({
  draft,
  activeBuilderTab,
  setActiveBuilderTab,
  selectedSection,
  selectedColumn,
  selectedBlock,
  selectedSectionId,
  selectedColumnId,
  handleAddBlock,
  handlePaletteBlockDragStart,
  handleAddSection,
  handleAddPresetSection,
  handleUpdateSection,
  handleUpdateSelectedColumn,
  handleUpdateSelectedColumnWidth,
  handleUpdateSelectedBlock,
  handleAddSelectedBlockItem,
  handleUpdateSelectedBlockItem,
  handleRemoveSelectedBlockItem,
  handleSelectSection,
  handleSelectColumn,
  handleStartBuilder,
  clearDragState,
}: BuilderSidebarProps) {
  const hasBuilderDocument = draft.editorDocument !== null

  return (
    <aside className="space-y-6 self-start xl:sticky xl:top-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-5 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Builder tools
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Template name, subject, and status stay on the library screen so this editor can keep styles and content controls closer to the canvas.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {builderTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveBuilderTab(tab.id)}
              className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                activeBuilderTab === tab.id
                  ? 'border-sky-400/50 bg-sky-500/10 text-sky-100'
                  : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeBuilderTab === 'blocks' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Click to add a block to the selected column, or drag one straight onto the canvas.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {builderBlockPalette.map((block) => (
                  <button
                    key={block.type}
                    type="button"
                    draggable={hasBuilderDocument}
                    onClick={() => handleAddBlock(block.type)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'copy'
                      handlePaletteBlockDragStart(block.type)
                    }}
                    onDragEnd={clearDragState}
                    disabled={!hasBuilderDocument}
                    title={block.description}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-left transition hover:border-white/20 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-sky-200">
                        <BlockPaletteIcon type={block.type} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-5 text-white">{block.label}</span>
                        <span className="block text-[11px] leading-4 text-slate-500">
                          {block.type === 'SocialLinks'
                            ? 'Inline links'
                            : block.type === 'LinkList'
                              ? 'Stacked links'
                              : 'Click or drag'}
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {!hasBuilderDocument ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                  Start the builder from the canvas or presets tab before adding blocks.
                </div>
              ) : !selectedBlock ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                  {selectedColumn
                    ? 'Add a block to the selected column, or select a block in the canvas to edit its content.'
                    : 'Select a column or block in the canvas to start adding content.'}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-white">{toBlockLabel(selectedBlock.type)}</p>
                  <p className="mt-1 text-xs text-slate-500">{selectedBlock.id}</p>

                  <div className="mt-4 space-y-3">
                    {['Hero', 'Text', 'Badge', 'Footer'].includes(selectedBlock.type) && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Copy
                        </span>
                        <textarea
                          value={selectedBlock.textContent ?? ''}
                          onChange={(event) => handleUpdateSelectedBlock({ textContent: event.target.value })}
                          className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </label>
                    )}

                    {['PropertyCard', 'FeatureCard', 'IconText', 'PromoBanner'].includes(selectedBlock.type) && (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Primary text
                          </span>
                          <textarea
                            value={selectedBlock.textContent ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ textContent: event.target.value })}
                            className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {selectedBlock.type === 'FeatureCard'
                              ? 'Supporting detail'
                              : selectedBlock.type === 'IconText'
                                ? 'Body copy'
                                : 'Secondary text'}
                          </span>
                          {selectedBlock.type === 'IconText' ? (
                            <textarea
                              value={selectedBlock.secondaryText ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ secondaryText: event.target.value })}
                              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          ) : (
                            <input
                              type="text"
                              value={selectedBlock.secondaryText ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ secondaryText: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          )}
                        </label>
                      </>
                    )}

                    {selectedBlock.type === 'Quote' && (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Quote
                          </span>
                          <textarea
                            value={selectedBlock.textContent ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ textContent: event.target.value })}
                            className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Attribution
                          </span>
                          <input
                            type="text"
                            value={selectedBlock.secondaryText ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ secondaryText: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                      </>
                    )}

                    {(['Image', 'Logo', 'PropertyCard', 'IconText'] as EditorBlockType[]).includes(selectedBlock.type) && (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Image URL
                          </span>
                          <input
                            type="text"
                            value={selectedBlock.imageUrl ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ imageUrl: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Alt text
                          </span>
                          <input
                            type="text"
                            value={selectedBlock.altText ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ altText: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        {selectedBlock.type === 'Logo' && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Click-through URL
                            </span>
                            <input
                              type="text"
                              value={selectedBlock.actionUrl ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ actionUrl: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </label>
                        )}
                      </>
                    )}

                    {(['Button', 'PropertyCard', 'PromoBanner'] as EditorBlockType[]).includes(selectedBlock.type) && (
                      <>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Label
                          </span>
                          <input
                            type="text"
                            value={selectedBlock.actionLabel ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ actionLabel: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            URL
                          </span>
                          <input
                            type="text"
                            value={selectedBlock.actionUrl ?? ''}
                            onChange={(event) => handleUpdateSelectedBlock({ actionUrl: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                      </>
                    )}

                    {selectedBlock.type === 'Spacer' && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Height
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={selectedBlock.spacing ?? ''}
                          onChange={(event) => handleUpdateSelectedBlock({ spacing: toOptionalNumber(event.target.value) })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </label>
                    )}

                    {selectedBlock.type === 'Divider' && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Thickness
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={selectedBlock.dividerThickness ?? ''}
                          onChange={(event) => handleUpdateSelectedBlock({ dividerThickness: toOptionalNumber(event.target.value) })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </label>
                    )}

                    {selectedBlock.type === 'Footer' && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Secondary line
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.secondaryText ?? ''}
                          onChange={(event) => handleUpdateSelectedBlock({ secondaryText: event.target.value })}
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                        />
                      </label>
                    )}

                    {(selectedBlock.type === 'LinkList' || selectedBlock.type === 'SocialLinks') && (
                      <BlockItemsEditor
                        items={selectedBlock.items ?? []}
                        title={selectedBlock.type === 'SocialLinks' ? 'Links' : 'List items'}
                        addLabel={selectedBlock.type === 'SocialLinks' ? 'Add social link' : 'Add link'}
                        onAdd={handleAddSelectedBlockItem}
                        onChange={handleUpdateSelectedBlockItem}
                        onRemove={handleRemoveSelectedBlockItem}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeBuilderTab === 'sections' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Start with a column layout, then refine the selected section below.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {builderSectionOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAddSection(option.columns)}
                    title={option.description}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-left transition hover:border-white/20 hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-violet-200">
                        <SectionLayoutIcon columns={option.columns} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-5 text-white">{option.label}</span>
                        <span className="block text-[11px] leading-4 text-slate-500">Add layout</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {draft.editorDocument ? (
                <div className="space-y-2">
                  {draft.editorDocument.sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => handleSelectSection(section.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedSectionId === section.id
                          ? 'border-sky-400/50 bg-sky-500/10'
                          : 'border-white/10 bg-slate-950/60 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-white">Section {index + 1}</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {section.columns.length} column{section.columns.length === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                  Add a section layout to start the canvas.
                </div>
              )}

              {selectedSection && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Columns</p>
                  {selectedSection.columns.map((column, index) => (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => handleSelectColumn(selectedSection.id, column.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedColumnId === column.id
                          ? 'border-sky-400/50 bg-sky-500/10'
                          : 'border-white/10 bg-slate-950/60 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <span className="block text-sm font-semibold text-white">Column {index + 1}</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {column.widthPercentage}% width · {column.blocks.length} block{column.blocks.length === 1 ? '' : 's'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeBuilderTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Drop in a starter composition, then tweak content and styles in the editor.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {builderPresetOptions.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddPresetSection(preset.id)}
                    title={preset.description}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-left transition hover:border-white/20 hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-emerald-200">
                        <PresetPaletteIcon preset={preset.id} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-5 text-white">{preset.label}</span>
                        <span className="block text-[11px] leading-4 text-slate-500">Starter preset</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {!hasBuilderDocument && (
                <button
                  type="button"
                  onClick={() => handleStartBuilder('hero')}
                  className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
                >
                  Start canvas with hero preset
                </button>
              )}
            </div>
          )}

          {activeBuilderTab === 'styles' && (
            <div className="space-y-4">
              {!selectedSection && !selectedColumn && !selectedBlock ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-5 text-sm text-slate-400">
                  Select a section, column, or block in the canvas to edit its available styles.
                </div>
              ) : (
                <>
                  {selectedSection && (
                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">Section styles</p>
                      <div className="mt-4 space-y-3">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Background
                          </span>
                          <input
                            type="text"
                            value={selectedSection.backgroundColor ?? ''}
                            onChange={(event) => handleUpdateSection({ backgroundColor: event.target.value })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Padding
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={selectedSection.padding ?? ''}
                            onChange={(event) => handleUpdateSection({ padding: toOptionalNumber(event.target.value) })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedColumn && (
                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">Column styles</p>
                      <div className="mt-4 space-y-3">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Width percentage
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={selectedColumn.widthPercentage}
                            onChange={(event) => handleUpdateSelectedColumnWidth(toOptionalNumber(event.target.value))}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <p className="text-xs text-slate-400">
                          Updating one column redistributes the remaining width across the other columns in this section.
                        </p>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Background
                          </span>
                          <input
                            type="text"
                            value={selectedColumn.backgroundColor ?? ''}
                            onChange={(event) => handleUpdateSelectedColumn({ backgroundColor: toOptionalText(event.target.value) })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Vertical alignment
                          </span>
                          <select
                            value={selectedColumn.verticalAlignment ?? 'Top'}
                            onChange={(event) => handleUpdateSelectedColumn({ verticalAlignment: event.target.value as EditorVerticalAlignment })}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          >
                            {columnVerticalAlignmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedBlock && (
                    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-white">{toBlockLabel(selectedBlock.type)} styles</p>
                      <div className="mt-4 space-y-3">
                        {!['Spacer', 'Divider'].includes(selectedBlock.type) && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Alignment
                            </span>
                            <select
                              value={selectedBlock.alignment ?? 'Left'}
                              onChange={(event) => handleUpdateSelectedBlock({ alignment: event.target.value as EditorAlignment })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            >
                              <option value="Left">Left</option>
                              <option value="Center">Center</option>
                              <option value="Right">Right</option>
                            </select>
                          </label>
                        )}

                        {['Hero', 'Text', 'Footer', 'Badge', 'Quote', 'LinkList', 'SocialLinks', 'Button', 'PropertyCard', 'FeatureCard', 'IconText', 'PromoBanner'].includes(selectedBlock.type) && (
                          <>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Text color
                              </span>
                              <input
                                type="text"
                                value={selectedBlock.textColor ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ textColor: event.target.value })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Font family
                              </span>
                              <select
                                value={selectedBlock.fontFamily ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ fontFamily: toOptionalText(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              >
                                <option value="">Default</option>
                                {fontFamilyOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Font weight
                              </span>
                              <select
                                value={selectedBlock.fontWeight ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ fontWeight: toOptionalText(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              >
                                <option value="">Default</option>
                                {fontWeightOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Font size
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={selectedBlock.fontSize ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ fontSize: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Line height
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={selectedBlock.lineHeight ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ lineHeight: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Letter spacing
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={selectedBlock.letterSpacing ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ letterSpacing: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Text transform
                              </span>
                              <select
                                value={selectedBlock.textTransform ?? 'None'}
                                onChange={(event) => handleUpdateSelectedBlock({ textTransform: event.target.value as EditorTextTransform })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              >
                                {textTransformOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Text decoration
                              </span>
                              <select
                                value={selectedBlock.textDecoration ?? 'None'}
                                onChange={(event) => handleUpdateSelectedBlock({ textDecoration: event.target.value as EditorTextDecoration })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              >
                                {textDecorationOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}

                        {['Badge', 'Button', 'PropertyCard', 'FeatureCard', 'PromoBanner'].includes(selectedBlock.type) && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Background
                            </span>
                            <input
                              type="text"
                              value={selectedBlock.backgroundColor ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ backgroundColor: event.target.value })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </label>
                        )}

                        {['Badge', 'Button', 'Image', 'Logo', 'Quote', 'PropertyCard', 'FeatureCard', 'PromoBanner'].includes(selectedBlock.type) && (
                          <>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Border color
                              </span>
                              <input
                                type="text"
                                value={selectedBlock.borderColor ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ borderColor: toOptionalText(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Border width
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={selectedBlock.borderWidth ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ borderWidth: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Border radius
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={selectedBlock.borderRadius ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ borderRadius: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                          </>
                        )}

                        {selectedBlock.type === 'Spacer' && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Height
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={selectedBlock.spacing ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ spacing: toOptionalNumber(event.target.value) })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </label>
                        )}

                        {selectedBlock.type === 'Button' && (
                          <>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Text color
                              </span>
                              <input
                                type="text"
                                value={selectedBlock.textColor ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ textColor: event.target.value })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Width percentage
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={selectedBlock.widthPercentage ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ widthPercentage: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                          </>
                        )}

                        {['Image', 'Logo'].includes(selectedBlock.type) && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Width percentage
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={selectedBlock.widthPercentage ?? ''}
                              onChange={(event) => handleUpdateSelectedBlock({ widthPercentage: toOptionalNumber(event.target.value) })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </label>
                        )}

                        {selectedBlock.type === 'Divider' && (
                          <>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Divider color
                              </span>
                              <input
                                type="text"
                                value={selectedBlock.dividerColor ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ dividerColor: event.target.value })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Thickness
                              </span>
                              <input
                                type="number"
                                min={1}
                                value={selectedBlock.dividerThickness ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ dividerThickness: toOptionalNumber(event.target.value) })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
