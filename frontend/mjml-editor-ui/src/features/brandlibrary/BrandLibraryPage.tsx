import { useState } from 'react'
import type { BrandLibraryDto, BrandHeadingStyleDto, BrandTextStyleDto } from '../../lib/api'
import { ColorInput } from '../builder/ColorInput'
import { fontFamilyOptions } from '../builder/builderModel'

type BrandLibraryPageProps = {
  library: BrandLibraryDto
  onSave: (lib: BrandLibraryDto) => Promise<void>
  onBack: () => void
}

const FONT_FAMILIES = fontFamilyOptions

const HEADING_LEVELS = ['H1', 'H2', 'H3'] as const

const HEADING_COLOR_DEFAULTS: Record<string, string> = {
  H1: '#ffffff',
  H2: '#e2e8f0',
  H3: '#94a3b8',
}

function getHeading(lib: BrandLibraryDto, level: string): BrandHeadingStyleDto {
  return lib.headingStyles.find((h) => h.level === level) ?? { level }
}

function setHeading(lib: BrandLibraryDto, level: string, patch: Partial<BrandHeadingStyleDto>): BrandLibraryDto {
  const existing = lib.headingStyles.find((h) => h.level === level)
  const updated = { ...(existing ?? { level }), ...patch }
  return {
    ...lib,
    headingStyles: existing
      ? lib.headingStyles.map((h) => (h.level === level ? updated : h))
      : [...lib.headingStyles, updated],
  }
}

function getParagraph(lib: BrandLibraryDto): BrandTextStyleDto {
  return lib.textStyles.find((t) => t.name === 'Paragraph') ?? { name: 'Paragraph' }
}

function setParagraph(lib: BrandLibraryDto, patch: Partial<BrandTextStyleDto>): BrandLibraryDto {
  const existing = lib.textStyles.find((t) => t.name === 'Paragraph')
  const updated = { ...(existing ?? { name: 'Paragraph' }), ...patch }
  return {
    ...lib,
    textStyles: existing
      ? lib.textStyles.map((t) => (t.name === 'Paragraph' ? updated : t))
      : [...lib.textStyles, updated],
  }
}

type SectionProps = { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-400">{title}</h3>
      {children}
    </div>
  )
}

type FieldProps = { label: string; children: React.ReactNode }
function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="mb-1.5 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20'
const selectCls = 'w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20'

type HeadingEditorProps = { lib: BrandLibraryDto; level: string; onChange: (lib: BrandLibraryDto) => void }
function HeadingEditor({ lib, level, onChange }: HeadingEditorProps) {
  const h = getHeading(lib, level)
  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
      <p className="mb-3 text-xs font-bold text-white">{level}</p>
      <Field label="Font Family">
        <select
          value={h.fontFamily ?? ''}
          onChange={(e) => onChange(setHeading(lib, level, { fontFamily: e.target.value || undefined }))}
          className={selectCls}
        >
          <option value="">Default</option>
          {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </Field>
      <div className="flex gap-3">
        <Field label="Size (px)">
          <input
            type="number"
            min={8}
            max={96}
            value={h.fontSize ?? ''}
            onChange={(e) => onChange(setHeading(lib, level, { fontSize: e.target.value ? Number(e.target.value) : undefined }))}
            className={inputCls}
          />
        </Field>
        <Field label="Weight">
          <select
            value={h.fontWeight ?? ''}
            onChange={(e) => onChange(setHeading(lib, level, { fontWeight: e.target.value || undefined }))}
            className={selectCls}
          >
            <option value="">Default</option>
            <option value="400">400 – Regular</option>
            <option value="600">600 – Semi-Bold</option>
            <option value="700">700 – Bold</option>
            <option value="800">800 – Extra-Bold</option>
          </select>
        </Field>
      </div>
      <Field label="Color">
        <ColorInput
          value={h.color ?? HEADING_COLOR_DEFAULTS[level] ?? '#ffffff'}
          onChange={(v) => onChange(setHeading(lib, level, { color: v }))}
          brandColors={lib.colors}
        />
      </Field>
    </div>
  )
}

function EmailPreview({ lib }: { lib: BrandLibraryDto }) {
  const h1 = getHeading(lib, 'H1')
  const h2 = getHeading(lib, 'H2')
  const h3 = getHeading(lib, 'H3')
  const para = getParagraph(lib)
  const btn = lib.buttonStyle
  const sectionBg = lib.sectionDefaultBackgroundColor ?? '#1a1a2e'

  const h1Style: React.CSSProperties = {
    fontFamily: h1.fontFamily ?? 'Georgia, serif',
    fontSize: h1.fontSize ? h1.fontSize + 'px' : '32px',
    fontWeight: (h1.fontWeight ?? '700') as React.CSSProperties['fontWeight'],
    color: h1.color ?? '#ffffff',
    margin: 0,
    lineHeight: 1.2,
  }
  const h2Style: React.CSSProperties = {
    fontFamily: h2.fontFamily ?? 'Arial, sans-serif',
    fontSize: h2.fontSize ? h2.fontSize + 'px' : '22px',
    fontWeight: (h2.fontWeight ?? '600') as React.CSSProperties['fontWeight'],
    color: h2.color ?? '#e2e8f0',
    margin: 0,
    lineHeight: 1.3,
  }
  const h3Style: React.CSSProperties = {
    fontFamily: h3.fontFamily ?? 'Arial, sans-serif',
    fontSize: h3.fontSize ? h3.fontSize + 'px' : '16px',
    fontWeight: (h3.fontWeight ?? '600') as React.CSSProperties['fontWeight'],
    color: h3.color ?? '#94a3b8',
    margin: 0,
    lineHeight: 1.4,
  }
  const paraStyle: React.CSSProperties = {
    fontFamily: para.fontFamily ?? 'Arial, sans-serif',
    fontSize: para.fontSize ? para.fontSize + 'px' : '15px',
    fontWeight: (para.fontWeight ?? '400') as React.CSSProperties['fontWeight'],
    color: para.color ?? '#cbd5e1',
    margin: 0,
    lineHeight: 1.6,
  }
  const btnStyle: React.CSSProperties = {
    backgroundColor: btn?.backgroundColor ?? '#0ea5e9',
    color: btn?.textColor ?? '#ffffff',
    borderRadius: btn?.borderRadius != null ? btn.borderRadius + 'px' : '8px',
    fontFamily: btn?.fontFamily ?? 'Arial, sans-serif',
    fontSize: btn?.fontSize ? btn.fontSize + 'px' : '15px',
    fontWeight: (btn?.fontWeight ?? '600') as React.CSSProperties['fontWeight'],
    padding: '12px 28px',
    display: 'inline-block',
    cursor: 'default',
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ backgroundColor: '#0f172a', padding: '20px 32px', textAlign: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '3px', color: '#64748b', textTransform: 'uppercase' }}>
          Estate Agent
        </span>
      </div>
      <div style={{ backgroundColor: sectionBg, padding: '48px 40px 40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '12px' }}>
          <h1 style={h1Style}>Find Your Dream Home</h1>
        </div>
        <div style={{ marginTop: '16px' }}>
          <h2 style={h2Style}>Exclusive Listings in Your Area</h2>
        </div>
        <div style={{ marginTop: '8px' }}>
          <h3 style={h3Style}>Available from January 2025</h3>
        </div>
        <div style={{ marginTop: '20px' }}>
          <p style={paraStyle}>
            Discover a curated selection of premium properties tailored to your lifestyle.
            Our expert team is here to help you every step of the way.
          </p>
        </div>
        <div style={{ marginTop: '28px' }}>
          <span style={btnStyle}>View Properties</span>
        </div>
      </div>
      {lib.colors.length > 0 && (
        <div style={{ backgroundColor: '#0f172a', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>Brand Colours</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lib.colors.map((c, i) => (
              <div key={i} title={c.name || c.value} style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c.value, border: '2px solid rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>
      )}
      <div style={{ backgroundColor: '#0f172a', padding: '20px 32px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
          123 Estate Road, London &bull; Unsubscribe
        </p>
      </div>
    </div>
  )
}

export function BrandLibraryPage({ library, onSave, onBack }: BrandLibraryPageProps) {
  const [lib, setLib] = useState<BrandLibraryDto>(library)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(lib)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const para = getParagraph(lib)

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Brand Library</h1>
            <p className="text-xs text-slate-500">Set your brand defaults — applied across all templates</p>
          </div>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : savedMsg ? '✓ Saved' : 'Save Brand Library'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-96 shrink-0 overflow-y-auto border-r border-white/10 p-5">
          <div className="flex flex-col gap-4">

            <Section title="Section Background">
              <Field label="Default Background Color">
                <ColorInput
                  value={lib.sectionDefaultBackgroundColor ?? ''}
                  onChange={(v) => setLib({ ...lib, sectionDefaultBackgroundColor: v || null })}
                  brandColors={lib.colors}
                />
              </Field>
            </Section>

            <Section title="Heading Styles">
              {HEADING_LEVELS.map((level) => (
                <HeadingEditor key={level} lib={lib} level={level} onChange={setLib} />
              ))}
            </Section>

            <Section title="Paragraph Style">
              <Field label="Font Family">
                <select
                  value={para.fontFamily ?? ''}
                  onChange={(e) => setLib(setParagraph(lib, { fontFamily: e.target.value || undefined }))}
                  className={selectCls}
                >
                  <option value="">Default</option>
                  {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </Field>
              <div className="flex gap-3">
                <Field label="Size (px)">
                  <input
                    type="number"
                    min={8}
                    max={48}
                    value={para.fontSize ?? ''}
                    onChange={(e) => setLib(setParagraph(lib, { fontSize: e.target.value ? Number(e.target.value) : undefined }))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Weight">
                  <select
                    value={para.fontWeight ?? ''}
                    onChange={(e) => setLib(setParagraph(lib, { fontWeight: e.target.value || undefined }))}
                    className={selectCls}
                  >
                    <option value="">Default</option>
                    <option value="400">400 – Regular</option>
                    <option value="600">600 – Semi-Bold</option>
                    <option value="700">700 – Bold</option>
                  </select>
                </Field>
              </div>
              <Field label="Color">
                <ColorInput
                  value={para.color ?? '#cbd5e1'}
                  onChange={(v) => setLib(setParagraph(lib, { color: v }))}
                  brandColors={lib.colors}
                />
              </Field>
            </Section>

            <Section title="Brand Colors">
              <div className="flex flex-col gap-2">
                {lib.colors.map((color, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-white/10 bg-slate-900/40 p-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          const updated = lib.colors.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c)
                          setLib({ ...lib, colors: updated })
                        }}
                        placeholder="Color name (e.g. Primary)"
                        className={inputCls + ' mb-2'}
                      />
                      <ColorInput
                        value={color.value}
                        onChange={(v) => {
                          const updated = lib.colors.map((c, idx) => idx === i ? { ...c, value: v } : c)
                          setLib({ ...lib, colors: updated })
                        }}
                      />
                    </div>
                    <button
                      onClick={() => setLib({ ...lib, colors: lib.colors.filter((_, idx) => idx !== i) })}
                      className="mt-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setLib({ ...lib, colors: [...lib.colors, { name: '', value: '#000000' }] })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm text-slate-400 transition hover:border-sky-400/50 hover:text-sky-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Color
                </button>
              </div>
            </Section>

            <Section title="Default Button Style">
              <Field label="Background Color">
                <ColorInput
                  value={lib.buttonStyle?.backgroundColor ?? '#0ea5e9'}
                  onChange={(v) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), backgroundColor: v } })}
                  brandColors={lib.colors}
                />
              </Field>
              <Field label="Text Color">
                <ColorInput
                  value={lib.buttonStyle?.textColor ?? '#ffffff'}
                  onChange={(v) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), textColor: v } })}
                  brandColors={lib.colors}
                />
              </Field>
              <Field label="Font Family">
                <select
                  value={lib.buttonStyle?.fontFamily ?? ''}
                  onChange={(e) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), fontFamily: e.target.value || undefined } })}
                  className={selectCls}
                >
                  <option value="">Default</option>
                  {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                </select>
              </Field>
              <div className="flex gap-3">
                <Field label="Font Size (px)">
                  <input
                    type="number"
                    min={8}
                    max={48}
                    value={lib.buttonStyle?.fontSize ?? ''}
                    onChange={(e) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), fontSize: e.target.value ? Number(e.target.value) : undefined } })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Border Radius (px)">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={lib.buttonStyle?.borderRadius ?? ''}
                    onChange={(e) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), borderRadius: e.target.value ? Number(e.target.value) : undefined } })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Font Weight">
                <select
                  value={lib.buttonStyle?.fontWeight ?? ''}
                  onChange={(e) => setLib({ ...lib, buttonStyle: { ...(lib.buttonStyle ?? {}), fontWeight: e.target.value || undefined } })}
                  className={selectCls}
                >
                  <option value="">Default</option>
                  <option value="400">400 – Regular</option>
                  <option value="600">600 – Semi-Bold</option>
                  <option value="700">700 – Bold</option>
                </select>
              </Field>
            </Section>

          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-900/50 p-8">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Live Preview</p>
          <EmailPreview lib={lib} />
        </main>
      </div>
    </div>
  )
}
