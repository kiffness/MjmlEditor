import type { BrandColorDto } from '../../lib/api'

type ColorInputProps = {
  value: string
  onChange: (value: string) => void
  brandColors?: BrandColorDto[]
}

/** Normalises any value to a 6-digit hex string for <input type="color"> */
export function toPickerHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [, r, g, b] = value.match(/^#(.)(.)(.)$/)!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#000000'
}

/** Combined color-swatch picker + hex text field, with optional brand color swatches */
export function ColorInput({ value, onChange, brandColors }: ColorInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {brandColors && brandColors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {brandColors.map((bc) => (
            <button
              key={bc.value}
              type="button"
              title={bc.name || bc.value}
              onClick={() => onChange(bc.value)}
              style={{ backgroundColor: bc.value }}
              className="h-6 w-6 shrink-0 rounded-full border-2 border-white/20 hover:border-sky-400 transition"
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toPickerHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-white/10 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
        />
      </div>
    </div>
  )
}
