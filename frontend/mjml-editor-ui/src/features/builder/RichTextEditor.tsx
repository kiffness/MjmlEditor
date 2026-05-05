import { useEditor, EditorContent } from '@tiptap/react'
import { mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BrandColorDto } from '../../lib/api'

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
]

const TEXT_DECORATIONS = [
  { label: 'Default', value: '' },
  { label: 'Underline', value: 'underline' },
  { label: 'None', value: 'none' },
  { label: 'Line-through', value: 'line-through' },
]

/** Link extension extended with per-link color, font-family, and text-decoration. */
const StyledLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      color: {
        default: null,
        parseHTML: element => element.style.color || null,
        renderHTML: () => ({}),
      },
      fontFamily: {
        default: null,
        parseHTML: element => element.style.fontFamily || null,
        renderHTML: () => ({}),
      },
      textDecoration: {
        default: null,
        parseHTML: element => element.style.textDecoration || null,
        renderHTML: () => ({}),
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const { color, fontFamily, textDecoration, ...rest } = HTMLAttributes as Record<string, unknown>
    const styleParts: string[] = []
    if (color) styleParts.push(`color: ${color}`)
    if (fontFamily) styleParts.push(`font-family: ${fontFamily}`)
    if (textDecoration) styleParts.push(`text-decoration: ${textDecoration}`)
    return [
      'a',
      mergeAttributes(
        (this.options as { HTMLAttributes?: Record<string, unknown> }).HTMLAttributes ?? {},
        rest,
        styleParts.length > 0 ? { style: styleParts.join('; ') } : {},
      ),
      0,
    ]
  },
})

interface RichTextEditorProps {
  value: string | null | undefined
  onChange: (html: string) => void
  placeholder?: string
  inline?: boolean
  brandColors?: BrandColorDto[]
}

export default function RichTextEditor({ value, onChange, placeholder, inline = false, brandColors = [] }: RichTextEditorProps) {
  const [showLinkPanel, setShowLinkPanel] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkColor, setLinkColor] = useState('')
  const [linkFontFamily, setLinkFontFamily] = useState('')
  const [linkTextDecoration, setLinkTextDecoration] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeColor, setActiveColor] = useState('#000000')
  const colorButtonRef = useRef<HTMLButtonElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null)
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null)
  // Keep a stable ref so the onUpdate closure never captures a stale onChange
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        code: false,
        hardBreak: inline ? false : undefined,
        // Disabled because we register these explicitly below
        underline: false,
        link: false,
      }),
      Underline,
      TextStyle,
      Color,
      StyledLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
        },
      }),
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value ?? '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition-colors ${
      active
        ? 'bg-blue-500/30 text-blue-300'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`

  const currentTextColor = editor.getAttributes('textStyle').color as string | undefined

  const openColorPicker = (e: React.MouseEvent) => {
    e.preventDefault()
    const { from, to } = editor.state.selection
    savedSelectionRef.current = { from, to }
    if (!showColorPicker) {
      setPickerRect(colorButtonRef.current?.getBoundingClientRect() ?? null)
      setActiveColor(currentTextColor ?? '#000000')
    }
    setShowColorPicker(v => !v)
    setShowLinkPanel(false)
  }

  const applyColor = (color: string, close = true) => {
    setActiveColor(color)
    const sel = savedSelectionRef.current
    const chain = editor.chain().focus()
    if (sel && sel.from !== sel.to) {
      chain.setTextSelection({ from: sel.from, to: sel.to })
    }
    chain.setColor(color).run()
    // Explicitly fire onChange in case setColor on a collapsed cursor doesn't trigger onUpdate
    onChangeRef.current(editor.getHTML())
    if (close) {
      setShowColorPicker(false)
      savedSelectionRef.current = null
    }
  }

  const resetColor = (e: React.MouseEvent) => {
    e.preventDefault()
    const sel = savedSelectionRef.current
    const chain = editor.chain().focus()
    if (sel && sel.from !== sel.to) {
      chain.setTextSelection({ from: sel.from, to: sel.to })
    }
    chain.unsetColor().run()
    onChangeRef.current(editor.getHTML())
    setActiveColor('#000000')
    setShowColorPicker(false)
    savedSelectionRef.current = null
  }

  const openLinkPanel = () => {
    if (showLinkPanel) {
      setShowLinkPanel(false)
      return
    }
    const attrs = editor.getAttributes('link') as {
      href?: string
      color?: string
      fontFamily?: string
      textDecoration?: string
    }
    setLinkHref(attrs.href ?? '')
    setLinkColor(attrs.color ?? '')
    setLinkFontFamily(attrs.fontFamily ?? '')
    setLinkTextDecoration(attrs.textDecoration ?? '')
    setShowLinkPanel(true)
  }

  const applyLink = () => {
    if (!linkHref) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setMark('link', {
          href: linkHref,
          target: '_blank',
          color: linkColor || null,
          fontFamily: linkFontFamily || null,
          textDecoration: linkTextDecoration || null,
        })
        .run()
    }
    // Ensure draft is updated immediately (mirrors applyColor pattern)
    onChangeRef.current(editor.getHTML())
    setShowLinkPanel(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    onChangeRef.current(editor.getHTML())
    setShowLinkPanel(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          className={btnClass(editor.isActive('bold'))}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          className={btnClass(editor.isActive('italic'))}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
          className={btnClass(editor.isActive('underline'))}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); openLinkPanel() }}
          className={btnClass(editor.isActive('link') || showLinkPanel)}
          title="Link"
        >
          🔗
        </button>

        {/* Text colour picker */}
        <div className="relative">
          <button
            ref={colorButtonRef}
            type="button"
            onMouseDown={openColorPicker}
            className={btnClass(showColorPicker)}
            title="Text colour"
          >
            <span className="flex flex-col items-center leading-none gap-[2px]">
              <span className="text-xs font-bold">A</span>
              <span
                className="h-[3px] w-full rounded-full"
                style={{ backgroundColor: currentTextColor ?? '#ffffff' }}
              />
            </span>
          </button>
        </div>
        {showColorPicker && pickerRect && createPortal(
          <>
            {/* Click-outside overlay */}
            <div
              className="fixed inset-0 z-[9998]"
              onMouseDown={() => { setShowColorPicker(false); savedSelectionRef.current = null }}
            />
            <div
              ref={colorPickerRef}
              className="z-[9999] fixed rounded-xl border border-white/10 bg-slate-900 p-3 flex flex-col gap-3 shadow-xl min-w-[220px] overflow-y-auto"
              style={{
                left: pickerRect.left,
                ...(pickerRect.bottom + 280 > window.innerHeight
                  ? { bottom: window.innerHeight - pickerRect.top + 6, maxHeight: pickerRect.top - 12 }
                  : { top: pickerRect.bottom + 6, maxHeight: window.innerHeight - pickerRect.bottom - 12 }),
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {/* Brand colours */}
              {brandColors.length > 0 && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">Brand</span>
                    <div className="flex flex-wrap gap-1.5">
                      {brandColors.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={e => { e.preventDefault(); applyColor(c.value) }}
                          className="h-7 w-7 rounded-lg border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                          style={{ backgroundColor: c.value }}
                          title={c.name || c.value}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-white/10" />
                </>
              )}

              {/* Native colour picker + hex input */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-slate-500">Colour</span>
                <div className="flex items-center gap-2">
                  {/* Swatch with native picker overlaid */}
                  <div className="relative h-9 w-9 flex-shrink-0 cursor-pointer rounded-lg border border-white/20 overflow-hidden shadow-sm"
                    style={{ backgroundColor: activeColor }}
                  >
                    <input
                      type="color"
                      value={activeColor}
                      onChange={e => applyColor(e.target.value, false)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      title="Pick colour"
                    />
                  </div>
                  {/* Hex input */}
                  <input
                    type="text"
                    value={activeColor}
                    onChange={e => { setActiveColor(e.target.value) }}
                    onKeyDown={e => { if (e.key === 'Enter') applyColor(activeColor) }}
                    placeholder="#000000"
                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); applyColor(activeColor) }}
                    className="px-2 py-1.5 rounded-lg bg-blue-600 text-xs text-white hover:bg-blue-500 flex-shrink-0"
                  >✓</button>
                </div>
              </div>

              {/* Remove colour */}
              <button
                type="button"
                onMouseDown={resetColor}
                className="w-full py-1.5 rounded-lg bg-slate-700/60 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Remove colour
              </button>
            </div>
          </>,
          document.body
        )}
      </div>

      {showLinkPanel && (
        <div className="rounded-xl border border-white/10 bg-slate-900 p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={linkHref}
              onChange={e => setLinkHref(e.target.value)}
              placeholder="https://..."
              className="flex-1 min-w-0 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-xs text-white outline-none focus:border-blue-500/50"
              onKeyDown={e => { if (e.key === 'Enter') applyLink() }}
            />
            <button type="button" onClick={applyLink} className="px-2 py-1 rounded-lg bg-blue-600 text-xs text-white hover:bg-blue-500">
              Apply
            </button>
            <button type="button" onClick={removeLink} className="px-2 py-1 rounded-lg bg-slate-700 text-xs text-slate-300 hover:bg-slate-600">
              Remove
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Color */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Color</span>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={linkColor || '#2563eb'}
                  onChange={e => setLinkColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent p-0"
                  title="Link color"
                />
                <input
                  type="text"
                  value={linkColor}
                  onChange={e => setLinkColor(e.target.value)}
                  placeholder="default"
                  className="min-w-0 flex-1 rounded border border-white/10 bg-slate-800 px-1 py-0.5 text-[11px] text-white outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            {/* Font family */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Font</span>
              <select
                value={linkFontFamily}
                onChange={e => setLinkFontFamily(e.target.value)}
                className="rounded border border-white/10 bg-slate-800 px-1 py-1 text-[11px] text-white outline-none focus:border-blue-500/50"
              >
                {FONT_FAMILIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Text decoration */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Decoration</span>
              <select
                value={linkTextDecoration}
                onChange={e => setLinkTextDecoration(e.target.value)}
                className="rounded border border-white/10 bg-slate-800 px-1 py-1 text-[11px] text-white outline-none focus:border-blue-500/50"
              >
                {TEXT_DECORATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={`w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus-within:border-blue-500/50 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1 [&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_a]:underline ${inline ? 'min-h-[40px]' : 'min-h-[100px]'}`}
      />
      {placeholder && (
        <span className="text-xs text-slate-500">{placeholder}</span>
      )}
    </div>
  )
}
