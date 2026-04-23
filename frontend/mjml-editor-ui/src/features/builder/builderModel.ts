import type {
  EditorAlignment,
  EditorBlock,
  EditorBlockItem,
  EditorBlockType,
  EditorDocument,
  EditorSection,
  EditorTextDecoration,
  EditorTextTransform,
  EditorVerticalAlignment,
  TemplateDto,
  TemplateStatus,
} from '../../lib/api'

export type TemplateDraft = {
  name: string
  subject: string
  status: TemplateStatus
  mjmlBody: string
  editorDocument: EditorDocument | null
}

export type BuilderSidebarTab = 'blocks' | 'sections' | 'presets' | 'styles'

export type BuilderPreset = 'hero' | 'announcement' | 'image-left-text-right' | 'image-right-text-left' | 'three-up-features'

export type CanvasDraggedBlock = {
  source: 'canvas'
  sectionId: string
  columnId: string
  blockId: string
}

export type PaletteDraggedBlock = {
  source: 'palette'
  blockType: EditorBlockType
}

export type DraggedBlock = CanvasDraggedBlock | PaletteDraggedBlock

export const builderTabs: { id: BuilderSidebarTab; label: string }[] = [
  { id: 'blocks', label: 'Blocks' },
  { id: 'sections', label: 'Sections' },
  { id: 'presets', label: 'Presets' },
  { id: 'styles', label: 'Styles' },
]

export const builderBlockPalette: { type: EditorBlockType; label: string; description: string }[] = [
  { type: 'Hero', label: 'Heading', description: 'Bold hero heading for campaign openers.' },
  { type: 'Text', label: 'Paragraph', description: 'Supporting copy or body text.' },
  { type: 'Image', label: 'Image', description: 'Visual block with image URL and alt text.' },
  { type: 'Logo', label: 'Logo', description: 'Brand logo with optional click-through URL.' },
  { type: 'PropertyCard', label: 'Property card', description: 'Featured listing card with image, details, and CTA.' },
  { type: 'FeatureCard', label: 'Feature card', description: 'Highlight a property attribute like bedrooms, price, or EPC.' },
  { type: 'IconText', label: 'Icon + text', description: 'Small icon-led summary for amenities or local highlights.' },
  { type: 'PromoBanner', label: 'Promo banner', description: 'High-contrast banner for open days, launches, or price drops.' },
  { type: 'Button', label: 'Button', description: 'Primary call-to-action button.' },
  { type: 'Badge', label: 'Badge', description: 'Small eyebrow or campaign label.' },
  { type: 'Quote', label: 'Quote', description: 'Testimonial or featured customer quote.' },
  { type: 'LinkList', label: 'Link list', description: 'Stacked navigation or footer links.' },
  { type: 'SocialLinks', label: 'Social links', description: 'Inline social or community links.' },
  { type: 'Footer', label: 'Footer/legal', description: 'Small-print legal or subscription copy.' },
  { type: 'Spacer', label: 'Spacer', description: 'Vertical breathing room between blocks.' },
  { type: 'Divider', label: 'Divider', description: 'Horizontal rule for section breaks.' },
]

export const builderSectionOptions = [
  { columns: 1, label: '1 column', description: 'Single-column content section.' },
  { columns: 2, label: '2 columns', description: 'Split layout for media and copy.' },
  { columns: 3, label: '3 columns', description: 'Three-up grid for features or offers.' },
  { columns: 4, label: '4 columns', description: 'Compact grid for product or icon rows.' },
  { columns: 5, label: '5 columns', description: 'Dense promotional strip for short content.' },
  { columns: 6, label: '6 columns', description: 'Six-up grid for small highlights or logos.' },
]

export const builderPresetOptions: { id: BuilderPreset; label: string; description: string }[] = [
  { id: 'hero', label: 'Hero intro', description: 'Heading, body copy, and CTA.' },
  { id: 'announcement', label: 'Announcement', description: 'Simple update with copy and divider.' },
  { id: 'image-left-text-right', label: 'Image left / text right', description: 'Media-first split layout with copy and CTA.' },
  { id: 'image-right-text-left', label: 'Image right / text left', description: 'Copy-first split layout with media on the right.' },
  { id: 'three-up-features', label: 'Three-up features', description: 'Three aligned columns for feature highlights.' },
]

export const fontFamilyOptions = ['Arial, sans-serif', 'Helvetica, Arial, sans-serif', 'Georgia, serif', 'Tahoma, sans-serif', 'Verdana, sans-serif']
export const fontWeightOptions = ['400', '500', '600', '700']
export const textTransformOptions: { value: EditorTextTransform; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'Uppercase', label: 'Uppercase' },
  { value: 'Lowercase', label: 'Lowercase' },
  { value: 'Capitalize', label: 'Capitalize' },
]
export const textDecorationOptions: { value: EditorTextDecoration; label: string }[] = [
  { value: 'None', label: 'None' },
  { value: 'Underline', label: 'Underline' },
  { value: 'LineThrough', label: 'Line through' },
]
export const columnVerticalAlignmentOptions: { value: EditorVerticalAlignment; label: string }[] = [
  { value: 'Top', label: 'Top' },
  { value: 'Middle', label: 'Middle' },
  { value: 'Bottom', label: 'Bottom' },
]

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function cloneEditorDocument(document: EditorDocument | null | undefined): EditorDocument | null {
  return document ? JSON.parse(JSON.stringify(document)) as EditorDocument : null
}

export function serializeEditorDocument(document: EditorDocument | null | undefined) {
  return document ? JSON.stringify(document) : ''
}

export function toOptionalNumber(value: string) {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toTextAlign(alignment?: EditorAlignment | null): 'left' | 'center' | 'right' {
  return (alignment ?? 'Left').toLowerCase() as 'left' | 'center' | 'right'
}

function toFlexAlign(alignment?: EditorAlignment | null): 'flex-start' | 'center' | 'flex-end' {
  switch (alignment) {
    case 'Center':
      return 'center'
    case 'Right':
      return 'flex-end'
    default:
      return 'flex-start'
  }
}

export function toFlexJustify(alignment?: EditorAlignment | null): 'flex-start' | 'center' | 'flex-end' {
  return toFlexAlign(alignment)
}

export function toColumnJustify(alignment?: EditorVerticalAlignment | null): 'flex-start' | 'center' | 'flex-end' {
  switch (alignment) {
    case 'Middle':
      return 'center'
    case 'Bottom':
      return 'flex-end'
    default:
      return 'flex-start'
  }
}

function toCssTextTransform(transform?: EditorTextTransform | null) {
  switch (transform) {
    case 'Uppercase':
      return 'uppercase'
    case 'Lowercase':
      return 'lowercase'
    case 'Capitalize':
      return 'capitalize'
    default:
      return 'none'
  }
}

function toCssTextDecoration(decoration?: EditorTextDecoration | null) {
  switch (decoration) {
    case 'Underline':
      return 'underline'
    case 'LineThrough':
      return 'line-through'
    default:
      return 'none'
  }
}

export function getBlockFrameStyle(block: EditorBlock) {
  return {
    backgroundColor: block.backgroundColor ?? undefined,
    borderColor: block.borderColor ?? undefined,
    borderWidth: block.borderWidth ?? undefined,
    borderStyle: block.borderWidth !== null && block.borderWidth !== undefined ? 'solid' : undefined,
    borderRadius: block.borderRadius ?? undefined,
  } as const
}

export function getBlockTextStyle(block: EditorBlock, defaults: { color: string; fontSize: number; fontWeight?: string }) {
  return {
    color: block.textColor ?? defaults.color,
    fontSize: `${block.fontSize ?? defaults.fontSize}px`,
    fontFamily: block.fontFamily ?? undefined,
    fontWeight: block.fontWeight ?? defaults.fontWeight ?? undefined,
    lineHeight: block.lineHeight ? `${block.lineHeight}px` : undefined,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    textTransform: toCssTextTransform(block.textTransform),
    textDecoration: toCssTextDecoration(block.textDecoration),
    textAlign: toTextAlign(block.alignment),
  } as const
}

export function toBlockLabel(type: EditorBlockType) {
  return builderBlockPalette.find((block) => block.type === type)?.label ?? type
}

export function createDefaultBlockItem(prefix: string, label: string, url: string): EditorBlockItem {
  return {
    id: createId(prefix),
    label,
    url,
  }
}

export function createDefaultBlock(type: EditorBlockType): EditorBlock {
  switch (type) {
    case 'Hero':
      return {
        id: createId('hero'),
        type,
        textContent: 'Fresh campaign headline',
        textColor: '#1f2937',
        alignment: 'Left',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 32,
      }
    case 'Text':
      return {
        id: createId('text'),
        type,
        textContent: 'Add supporting copy for this campaign section.',
        textColor: '#475569',
        alignment: 'Left',
        fontSize: 16,
        lineHeight: 24,
      }
    case 'Image':
      return {
        id: createId('image'),
        type,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
        altText: 'Campaign visual',
        alignment: 'Center',
        widthPercentage: 100,
      }
    case 'Logo':
      return {
        id: createId('logo'),
        type,
        imageUrl: 'https://dummyimage.com/320x120/0f172a/ffffff.png&text=Brand+Logo',
        altText: 'Brand logo',
        actionUrl: 'https://example.com',
        alignment: 'Left',
        widthPercentage: 45,
      }
    case 'PropertyCard':
      return {
        id: createId('property'),
        type,
        imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
        altText: 'Featured property exterior',
        textContent: 'Family home with garden in Balham',
        secondaryText: 'Guide price {{ params.price }} · 3 bedrooms · 2 bathrooms',
        actionLabel: 'View property',
        actionUrl: 'https://example.com/listings/featured-home',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        alignment: 'Left',
        borderColor: '#dbe4f0',
        borderWidth: 1,
        borderRadius: 20,
      }
    case 'FeatureCard':
      return {
        id: createId('feature-card'),
        type,
        textContent: 'Bedrooms',
        secondaryText: '{{ params.bedrooms }} spacious rooms',
        backgroundColor: '#eff6ff',
        textColor: '#1d4ed8',
        alignment: 'Center',
        fontWeight: '700',
        fontSize: 18,
        lineHeight: 26,
        borderColor: '#bfdbfe',
        borderWidth: 1,
        borderRadius: 18,
      }
    case 'IconText':
      return {
        id: createId('icon-text'),
        type,
        imageUrl: 'https://dummyimage.com/96x96/e2e8f0/0f172a.png&text=Bed',
        altText: 'Amenity icon',
        textContent: 'Private driveway parking',
        secondaryText: 'Ideal for buyers looking for easy daily access.',
        textColor: '#334155',
        alignment: 'Left',
        fontSize: 15,
        lineHeight: 22,
      }
    case 'PromoBanner':
      return {
        id: createId('promo-banner'),
        type,
        textContent: 'Open house this Saturday',
        secondaryText: 'Book viewings between 10am and 2pm before slots fill up.',
        actionLabel: 'Reserve a viewing',
        actionUrl: 'https://example.com/viewings/open-house',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        alignment: 'Left',
        fontWeight: '700',
        fontSize: 20,
        lineHeight: 28,
        borderRadius: 20,
      }
    case 'Button':
      return {
        id: createId('button'),
        type,
        actionLabel: 'Shop now',
        actionUrl: 'https://example.com',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        alignment: 'Left',
        borderRadius: 12,
        widthPercentage: 60,
      }
    case 'Badge':
      return {
        id: createId('badge'),
        type,
        textContent: 'New collection',
        backgroundColor: '#dbeafe',
        textColor: '#1d4ed8',
        alignment: 'Left',
        fontSize: 13,
        borderRadius: 999,
      }
    case 'Quote':
      return {
        id: createId('quote'),
        type,
        textContent: 'This campaign builder makes it much faster to ship polished emails.',
        secondaryText: 'A happy marketing manager',
        textColor: '#334155',
        alignment: 'Left',
        fontSize: 18,
        lineHeight: 28,
      }
    case 'LinkList':
      return {
        id: createId('links'),
        type,
        alignment: 'Left',
        textColor: '#2563eb',
        fontSize: 14,
        items: [
          createDefaultBlockItem('link', 'Shop now', 'https://example.com/shop'),
          createDefaultBlockItem('link', 'New arrivals', 'https://example.com/new'),
          createDefaultBlockItem('link', 'Contact us', 'https://example.com/contact'),
        ],
      }
    case 'SocialLinks':
      return {
        id: createId('social'),
        type,
        alignment: 'Center',
        textColor: '#2563eb',
        fontSize: 14,
        items: [
          createDefaultBlockItem('social', 'Instagram', 'https://instagram.com'),
          createDefaultBlockItem('social', 'Facebook', 'https://facebook.com'),
          createDefaultBlockItem('social', 'LinkedIn', 'https://linkedin.com'),
        ],
      }
    case 'Footer':
      return {
        id: createId('footer'),
        type,
        textContent: 'You are receiving this email because you subscribed to updates.',
        secondaryText: '123 Market Street, London',
        textColor: '#64748b',
        alignment: 'Center',
        fontSize: 12,
        lineHeight: 18,
      }
    case 'Spacer':
      return {
        id: createId('spacer'),
        type,
        spacing: 24,
      }
    case 'Divider':
      return {
        id: createId('divider'),
        type,
        dividerColor: '#d1d5db',
        dividerThickness: 1,
      }
  }
}

export function createSection(columnCount = 1, blocksPerColumn?: EditorBlock[][]): EditorSection {
  const safeColumnCount = Math.max(1, columnCount)
  const widthPercentage = Math.floor(100 / safeColumnCount)

  return {
    id: createId('section'),
    backgroundColor: '#ffffff',
    padding: 24,
    columns: Array.from({ length: safeColumnCount }, (_, index) => ({
      id: createId('column'),
      widthPercentage: index === safeColumnCount - 1
        ? 100 - (widthPercentage * (safeColumnCount - 1))
        : widthPercentage,
      verticalAlignment: 'Top',
      blocks: blocksPerColumn?.[index]?.length
        ? blocksPerColumn[index]
        : index === 0
          ? [createDefaultBlock('Text')]
          : [],
    })),
  }
}

function createFeatureColumn(title: string, body: string): EditorBlock[] {
  return [
    {
      id: createId('hero'),
      type: 'Hero',
      textContent: title,
      textColor: '#1f2937',
      alignment: 'Center',
      fontSize: 18,
    },
    {
      id: createId('text'),
      type: 'Text',
      textContent: body,
      textColor: '#475569',
      alignment: 'Center',
      fontSize: 14,
    },
  ]
}

function createImageTextColumns(imageFirst: boolean): EditorBlock[][] {
  const imageColumn: EditorBlock[] = [
    {
      id: createId('image'),
      type: 'Image',
      imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      altText: 'Featured product',
      alignment: 'Center',
    },
  ]

  const textColumn: EditorBlock[] = [
    {
      id: createId('hero'),
      type: 'Hero',
      textContent: imageFirst ? 'Image left, copy right' : 'Copy left, image right',
      textColor: '#1f2937',
      alignment: 'Left',
      fontSize: 22,
    },
    {
      id: createId('text'),
      type: 'Text',
      textContent: 'Use this split layout for product highlights, offers, or editorial modules.',
      textColor: '#475569',
      alignment: 'Left',
      fontSize: 16,
    },
    {
      id: createId('button'),
      type: 'Button',
      actionLabel: 'Learn more',
      actionUrl: 'https://example.com',
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      alignment: 'Left',
    },
  ]

  return imageFirst ? [imageColumn, textColumn] : [textColumn, imageColumn]
}

export function createStarterEditorDocument(headline = 'Fresh campaign headline', body = 'Add supporting copy for this campaign.', ctaLabel = 'Shop now'): EditorDocument {
  return {
    version: 1,
    sections: [
      createSection(1, [[
        {
          id: createId('hero'),
          type: 'Hero',
          textContent: headline,
          textColor: '#1f2937',
          alignment: 'Left',
          fontSize: 24,
        },
        {
          id: createId('text'),
          type: 'Text',
          textContent: body,
          textColor: '#475569',
          alignment: 'Left',
          fontSize: 16,
        },
        {
          id: createId('button'),
          type: 'Button',
          actionLabel: ctaLabel,
          actionUrl: 'https://example.com',
          backgroundColor: '#2563eb',
          textColor: '#ffffff',
          alignment: 'Left',
        },
      ]]),
    ],
  }
}

export function createPresetSections(preset: BuilderPreset): EditorSection[] {
  switch (preset) {
    case 'hero':
      return [createStarterEditorDocument().sections[0]]
    case 'announcement':
      return [
        createSection(1, [[
          {
            id: createId('hero'),
            type: 'Hero',
            textContent: 'Big update for your subscribers',
            textColor: '#0f172a',
            alignment: 'Left',
            fontSize: 22,
          },
          {
            id: createId('text'),
            type: 'Text',
            textContent: 'Lead with the most important change, then invite readers to keep exploring.',
            textColor: '#475569',
            alignment: 'Left',
            fontSize: 16,
          },
          createDefaultBlock('Divider'),
        ]]),
      ]
    case 'image-left-text-right':
      return [
        createSection(2, createImageTextColumns(true)),
      ]
    case 'image-right-text-left':
      return [
        createSection(2, createImageTextColumns(false)),
      ]
    case 'three-up-features':
      return [
        createSection(3, [
          createFeatureColumn('Free delivery', 'Highlight a logistics or customer promise.'),
          createFeatureColumn('New arrivals', 'Spotlight fresh product or campaign themes.'),
          createFeatureColumn('Member offer', 'Call out an incentive or exclusive benefit.'),
        ]),
      ]
  }
}

export function createStarterMjml(headline = 'Fresh campaign headline', body = 'Add supporting copy for this campaign.', ctaLabel = 'Shop now') {
  return `<mjml>
  <mj-body background-color="#f5f7fb">
    <mj-section background-color="#ffffff" padding="24px">
      <mj-column>
        <mj-text font-size="24px" font-weight="700" color="#1f2937">${headline}</mj-text>
        <mj-text font-size="16px" color="#4b5563">${body}</mj-text>
        <mj-button background-color="#2563eb" color="#ffffff">${ctaLabel}</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, movedItem)
  return nextItems
}

export function isCanvasDraggedBlock(draggedBlock: DraggedBlock | null): draggedBlock is CanvasDraggedBlock {
  return draggedBlock?.source === 'canvas'
}

export function isPaletteDraggedBlock(draggedBlock: DraggedBlock | null): draggedBlock is PaletteDraggedBlock {
  return draggedBlock?.source === 'palette'
}

export function duplicateBlockWithIds(block: EditorBlock): EditorBlock {
  return {
    ...block,
    id: createId('block'),
    items: block.items?.map((item) => ({
      ...item,
      id: createId('item'),
    })),
  }
}

export function duplicateSectionWithIds(section: EditorSection): EditorSection {
  return {
    ...section,
    id: createId('section'),
    columns: section.columns.map((column) => ({
      ...column,
      id: createId('column'),
      blocks: column.blocks.map(duplicateBlockWithIds),
    })),
  }
}

export function insertBlock(blocks: EditorBlock[], block: EditorBlock, targetBlockId?: string) {
  const nextBlocks = [...blocks]
  const insertIndex = targetBlockId
    ? nextBlocks.findIndex((candidate) => candidate.id === targetBlockId)
    : nextBlocks.length

  nextBlocks.splice(insertIndex < 0 ? nextBlocks.length : insertIndex, 0, block)
  return nextBlocks
}

export function toDraft(template: TemplateDto): TemplateDraft {
  return {
    name: template.name,
    subject: template.subject,
    status: template.status,
    mjmlBody: template.mjmlBody,
    editorDocument: cloneEditorDocument(template.editorDocument ?? null),
  }
}
