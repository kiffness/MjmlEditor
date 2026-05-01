import { useEditor, EditorContent } from '@tiptap/react'
import { mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect, useState } from 'react'

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
}

export default function RichTextEditor({ value, onChange, placeholder, inline = false }: RichTextEditorProps) {
  const [showLinkPanel, setShowLinkPanel] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const [linkColor, setLinkColor] = useState('')
  const [linkFontFamily, setLinkFontFamily] = useState('')
  const [linkTextDecoration, setLinkTextDecoration] = useState('')

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
      }),
      Underline,
      StyledLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
        },
      }),
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
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
    setShowLinkPanel(false)
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkPanel(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={openLinkPanel}
          className={btnClass(editor.isActive('link') || showLinkPanel)}
          title="Link"
        >
          🔗
        </button>
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
