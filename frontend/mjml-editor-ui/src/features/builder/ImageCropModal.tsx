import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { getApiBaseUrl, getStoredAuthToken } from '../../lib/api'

type ImageCropModalProps = {
  imageUrl: string
  aspectRatio?: number
  onConfirm: (croppedBlob: Blob, fileName: string) => Promise<void>
  onClose: () => void
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  let objectUrl: string
  let shouldRevoke = true

  if (imageSrc.startsWith('blob:')) {
    // Local blob URL — same-origin, no proxy needed
    objectUrl = imageSrc
    shouldRevoke = false
  } else {
    // Fetch remote image via backend proxy to avoid browser CORS restrictions
    const proxyUrl = `${getApiBaseUrl()}/api/media/proxy?url=${encodeURIComponent(imageSrc)}`
    const authToken = getStoredAuthToken()
    const res = await fetch(proxyUrl, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
    if (!res.ok) throw new Error('Failed to load image via proxy')
    const blob = await res.blob()
    objectUrl = URL.createObjectURL(blob)
  }
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png')
    )
  } finally {
    if (shouldRevoke) URL.revokeObjectURL(objectUrl)
  }
}

const ASPECT_PRESETS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:1', value: 3 },
  { label: '3:4', value: 3 / 4 },
]

export function ImageCropModal({ imageUrl, aspectRatio: initialAspect, onConfirm, onClose }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1.5)
  const [aspect, setAspect] = useState<number | undefined>(initialAspect)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels)
      await onConfirm(blob, `cropped-${Date.now()}.png`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex w-[680px] flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Crop Image</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative h-[360px] bg-slate-950">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs text-slate-400">Aspect</span>
            <div className="flex gap-1.5">
              {ASPECT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setAspect(p.value)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    aspect === p.value
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24 accent-sky-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirm()}
              disabled={saving || !croppedAreaPixels}
              className="rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {saving ? 'Uploading…' : 'Apply & Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
