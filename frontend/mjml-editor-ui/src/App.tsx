import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  clearStoredAuthToken,
  createTemplate,
  deleteTemplate,
  type EditorAlignment,
  type EditorBlock,
  type EditorBlockType,
  type EditorColumn,
  type EditorDocument,
  type EditorSection,
  getApiBaseUrl,
  getCurrentUser,
  getStoredAuthToken,
  getTemplate,
  listTemplateRevisions,
  listTemplates,
  listTenants,
  login,
  publishTemplate,
  renderMjml,
  rollbackTemplate,
  type AuthenticatedUserDto,
  type MjmlRenderIssueDto,
  type TemplateDto,
  type TemplateRevisionDto,
  type TemplateStatus,
  type TemplateSummaryDto,
  type TenantDto,
  updateTemplate,
} from './lib/api'

type StatusFilter = 'All' | TemplateStatus

type TemplateDraft = {
  name: string
  subject: string
  status: TemplateStatus
  mjmlBody: string
  editorDocument: EditorDocument | null
}

type AppRoute =
  | { kind: 'library' }
  | { kind: 'editor'; templateId: string }

type BuilderSidebarTab = 'blocks' | 'sections' | 'presets' | 'styles'

type BuilderPreset = 'hero' | 'announcement' | 'image-left-text-right' | 'image-right-text-left' | 'three-up-features'

type DraggedBlock = {
  sectionId: string
  columnId: string
  blockId: string
}

type PreviewViewport = 'desktop' | 'tablet' | 'mobile'

const sidebarItems = [
  { label: 'Templates', count: null, active: true },
  { label: 'Campaign library', count: 7, active: false },
  { label: 'Audience sync', count: 3, active: false },
  { label: 'Activity feed', count: 12, active: false },
]

const builderTabs: { id: BuilderSidebarTab; label: string }[] = [
  { id: 'blocks', label: 'Blocks' },
  { id: 'sections', label: 'Sections' },
  { id: 'presets', label: 'Presets' },
  { id: 'styles', label: 'Styles' },
]

const builderBlockPalette: { type: EditorBlockType; label: string; description: string }[] = [
  { type: 'Hero', label: 'Heading', description: 'Bold hero heading for campaign openers.' },
  { type: 'Text', label: 'Paragraph', description: 'Supporting copy or body text.' },
  { type: 'Image', label: 'Image', description: 'Visual block with image URL and alt text.' },
  { type: 'Button', label: 'Button', description: 'Primary call-to-action button.' },
  { type: 'Spacer', label: 'Spacer', description: 'Vertical breathing room between blocks.' },
  { type: 'Divider', label: 'Divider', description: 'Horizontal rule for section breaks.' },
]

const builderSectionOptions = [
  { columns: 1, label: '1 column', description: 'Single-column content section.' },
  { columns: 2, label: '2 columns', description: 'Split layout for media and copy.' },
  { columns: 3, label: '3 columns', description: 'Three-up grid for features or offers.' },
  { columns: 4, label: '4 columns', description: 'Compact grid for product or icon rows.' },
  { columns: 5, label: '5 columns', description: 'Dense promotional strip for short content.' },
  { columns: 6, label: '6 columns', description: 'Six-up grid for small highlights or logos.' },
]

const builderPresetOptions: { id: BuilderPreset; label: string; description: string }[] = [
  { id: 'hero', label: 'Hero intro', description: 'Heading, body copy, and CTA.' },
  { id: 'announcement', label: 'Announcement', description: 'Simple update with copy and divider.' },
  { id: 'image-left-text-right', label: 'Image left / text right', description: 'Media-first split layout with copy and CTA.' },
  { id: 'image-right-text-left', label: 'Image right / text left', description: 'Copy-first split layout with media on the right.' },
  { id: 'three-up-features', label: 'Three-up features', description: 'Three aligned columns for feature highlights.' },
]

const mjmlSnippetOptions = [
  {
    id: 'hero',
    label: 'Hero section',
    snippet: `\n  <mj-section background-color="#ffffff" padding="24px">\n    <mj-column>\n      <mj-text font-size="28px" font-weight="700" color="#111827">Launch your next campaign</mj-text>\n      <mj-text font-size="16px" color="#4b5563">Use this hero block to frame the main message for your subscribers.</mj-text>\n      <mj-button background-color="#2563eb" color="#ffffff" href="https://example.com">Shop now</mj-button>\n    </mj-column>\n  </mj-section>`,
  },
  {
    id: 'two-column',
    label: 'Two-column feature',
    snippet: `\n  <mj-section background-color="#ffffff" padding="24px">\n    <mj-column width="50%">\n      <mj-image src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80" alt="Feature image" />\n    </mj-column>\n    <mj-column width="50%">\n      <mj-text font-size="22px" font-weight="700" color="#111827">Feature highlight</mj-text>\n      <mj-text font-size="16px" color="#4b5563">Pair product imagery with supporting copy and a concise CTA.</mj-text>\n      <mj-button background-color="#0f172a" color="#ffffff" href="https://example.com">Learn more</mj-button>\n    </mj-column>\n  </mj-section>`,
  },
  {
    id: 'footer',
    label: 'Footer',
    snippet: `\n  <mj-section padding="24px">\n    <mj-column>\n      <mj-divider border-color="#cbd5e1" border-width="1px" />\n      <mj-text font-size="12px" color="#64748b" align="center">You are receiving this email because you subscribed to campaign updates.</mj-text>\n      <mj-text font-size="12px" color="#94a3b8" align="center">123 Market Street, London</mj-text>\n    </mj-column>\n  </mj-section>`,
  },
] as const

const autoPreviewDelayMs = 450

const previewViewportOptions: { id: PreviewViewport; label: string; width: number; description: string }[] = [
  { id: 'desktop', label: 'Desktop', width: 840, description: 'Wide viewport for desktop email clients.' },
  { id: 'tablet', label: 'Tablet', width: 640, description: 'Mid-size viewport before mobile stacking.' },
  { id: 'mobile', label: 'Mobile', width: 390, description: 'Phone-sized viewport with stacked columns.' },
]

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneEditorDocument(document: EditorDocument | null | undefined): EditorDocument | null {
  return document ? JSON.parse(JSON.stringify(document)) as EditorDocument : null
}

function serializeEditorDocument(document: EditorDocument | null | undefined) {
  return document ? JSON.stringify(document) : ''
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toBlockLabel(type: EditorBlockType) {
  return builderBlockPalette.find((block) => block.type === type)?.label ?? type
}

function createDefaultBlock(type: EditorBlockType): EditorBlock {
  switch (type) {
    case 'Hero':
      return {
        id: createId('hero'),
        type,
        textContent: 'Fresh campaign headline',
        textColor: '#1f2937',
        alignment: 'Left',
        fontSize: 24,
      }
    case 'Text':
      return {
        id: createId('text'),
        type,
        textContent: 'Add supporting copy for this campaign section.',
        textColor: '#475569',
        alignment: 'Left',
        fontSize: 16,
      }
    case 'Image':
      return {
        id: createId('image'),
        type,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
        altText: 'Campaign visual',
        alignment: 'Center',
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

function createSection(columnCount = 1, blocksPerColumn?: EditorBlock[][]): EditorSection {
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

function createStarterEditorDocument(headline = 'Fresh campaign headline', body = 'Add supporting copy for this campaign.', ctaLabel = 'Shop now'): EditorDocument {
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

function createPresetSections(preset: BuilderPreset): EditorSection[] {
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

function createStarterMjml(headline = 'Fresh campaign headline', body = 'Add supporting copy for this campaign.', ctaLabel = 'Shop now') {
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

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [movedItem] = nextItems.splice(fromIndex, 1)
  nextItems.splice(toIndex, 0, movedItem)
  return nextItems
}

  function getPreviewSignature(draft: TemplateDraft) {
    return JSON.stringify({
      mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
      editorDocument: draft.editorDocument,
    })
  }

  function getPublishButtonLabel(hasUnsavedChanges: boolean, isPublishing: boolean) {
    if (isPublishing) {
      return hasUnsavedChanges ? 'Saving & publishing…' : 'Publishing…'
    }

    return hasUnsavedChanges ? 'Save & publish' : 'Publish'
  }

function toDraft(template: TemplateDto): TemplateDraft {
  return {
    name: template.name,
    subject: template.subject,
    status: template.status,
    mjmlBody: template.mjmlBody,
    editorDocument: cloneEditorDocument(template.editorDocument ?? null),
  }
}

function parseAppRoute(pathname: string): AppRoute {
  const editorMatch = pathname.match(/^\/templates\/([^/]+)\/editor\/?$/)

  if (editorMatch) {
    return {
      kind: 'editor',
      templateId: decodeURIComponent(editorMatch[1]),
    }
  }

  return { kind: 'library' }
}

function getPathForRoute(route: AppRoute) {
  return route.kind === 'editor'
    ? `/templates/${encodeURIComponent(route.templateId)}/editor`
    : '/'
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseAppRoute(window.location.pathname))
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserDto | null>(null)
  const [loginEmail, setLoginEmail] = useState('admin@demo.local')
  const [loginPassword, setLoginPassword] = useState('Password123!')
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [tenants, setTenants] = useState<TenantDto[]>([])
  const [tenantId, setTenantId] = useState('')
  const tenantIdRef = useRef('')
  const [templates, setTemplates] = useState<TemplateSummaryDto[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const selectedTemplateIdRef = useRef<string | null>(null)
  const mjmlEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDto | null>(null)
  const [draft, setDraft] = useState<TemplateDraft | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [isTenantsLoading, setIsTenantsLoading] = useState(false)
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false)
  const [isTemplateLoading, setIsTemplateLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRollingBackRevisionId, setIsRollingBackRevisionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [revisionRefreshNonce, setRevisionRefreshNonce] = useState(0)
  const [renderedHtml, setRenderedHtml] = useState('')
  const [renderIssues, setRenderIssues] = useState<MjmlRenderIssueDto[]>([])
  const [isRenderingPreview, setIsRenderingPreview] = useState(false)
  const [isAutoPreviewEnabled, setIsAutoPreviewEnabled] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>('desktop')
  const [previewMjmlSnapshot, setPreviewMjmlSnapshot] = useState<string | null>(null)
  const [revisions, setRevisions] = useState<TemplateRevisionDto[]>([])
  const [isRevisionsLoading, setIsRevisionsLoading] = useState(false)
  const [activeBuilderTab, setActiveBuilderTab] = useState<BuilderSidebarTab>('blocks')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<DraggedBlock | null>(null)
  const [sectionDropTargetId, setSectionDropTargetId] = useState<string | null>(null)
  const [columnDropTargetId, setColumnDropTargetId] = useState<string | null>(null)
  const [blockDropTargetId, setBlockDropTargetId] = useState<string | null>(null)

  const apiBaseUrl = getApiBaseUrl()
  const activeTenant = tenants.find((tenant) => tenant.id === tenantId) ?? null
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'All'
  const seedCommand = 'dotnet run --project backend\\MjmlEditor.Seed'
  const seedOverrideCommand = `${seedCommand} -- --Seed:TemplatesPerTenant=12`
  const isPreviewStale = draft !== null && previewMjmlSnapshot !== getPreviewSignature(draft)
  const isEditorRoute = route.kind === 'editor'
  const selectedSection = useMemo(
    () => draft?.editorDocument?.sections.find((section) => section.id === selectedSectionId) ?? null,
    [draft?.editorDocument, selectedSectionId]
  )
  const selectedColumn = useMemo(
    () => selectedSection?.columns.find((column) => column.id === selectedColumnId) ?? null,
    [selectedColumnId, selectedSection]
  )
  const selectedBlock = useMemo(
    () => (selectedColumn ?? selectedSection?.columns[0])?.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [selectedBlockId, selectedColumn, selectedSection]
  )

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return templates.filter((template) => {
      const matchesSearch =
        query.length === 0
        || template.name.toLowerCase().includes(query)
        || template.subject.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All' || template.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, templates])

  const counts = useMemo(
    () => ({
      total: templates.length,
      draft: templates.filter((template) => template.status === 'Draft').length,
      published: templates.filter((template) => template.status === 'Published').length,
      archived: templates.filter((template) => template.status === 'Archived').length,
    }),
    [templates]
  )

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedTemplate || !draft) {
      return false
    }

    return (
      selectedTemplate.name !== draft.name
      || selectedTemplate.subject !== draft.subject
      || selectedTemplate.status !== draft.status
      || selectedTemplate.mjmlBody !== draft.mjmlBody
      || serializeEditorDocument(selectedTemplate.editorDocument ?? null) !== serializeEditorDocument(draft.editorDocument)
    )
  }, [draft, selectedTemplate])

  const setActiveTenant = useCallback((nextTenantId: string) => {
    tenantIdRef.current = nextTenantId
    setTenantId(nextTenantId)
  }, [])

  const resetPreview = useCallback(() => {
    setRenderedHtml('')
    setRenderIssues([])
    setPreviewMjmlSnapshot(null)
  }, [])

  const navigateToRoute = useCallback((nextRoute: AppRoute, replace = false) => {
    const nextPath = getPathForRoute(nextRoute)

    if (replace) {
      window.history.replaceState(null, '', nextPath)
    } else {
      window.history.pushState(null, '', nextPath)
    }

    setRoute(nextRoute)
  }, [])

  const setActiveTemplateId = useCallback((nextTemplateId: string | null) => {
    selectedTemplateIdRef.current = nextTemplateId
    setSelectedTemplateId(nextTemplateId)
    setIsTemplateLoading(Boolean(nextTemplateId))
    setRevisions([])
    setIsRevisionsLoading(Boolean(nextTemplateId))
    setActiveBuilderTab('blocks')
    setSelectedSectionId(null)
    setSelectedColumnId(null)
    setSelectedBlockId(null)
    setIsPreviewModalOpen(false)
    resetPreview()
  }, [resetPreview])

  const clearWorkspace = useCallback(() => {
    tenantIdRef.current = ''
    selectedTemplateIdRef.current = null
    setTenants([])
    setTenantId('')
    setTemplates([])
    setSelectedTemplateId(null)
    setSelectedTemplate(null)
    setDraft(null)
    setRevisions([])
    setSearch('')
    setStatusFilter('All')
    setIsTenantsLoading(false)
    setIsTemplatesLoading(false)
    setIsTemplateLoading(false)
    setIsRevisionsLoading(false)
    setIsPreviewModalOpen(false)
    resetPreview()
  }, [resetPreview])

  const handleLogout = useCallback((message?: string) => {
    clearStoredAuthToken()
    setCurrentUser(null)
    clearWorkspace()
    setErrorMessage(null)
    setInfoMessage(message ?? null)
  }, [clearWorkspace])

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      handleLogout('Session expired. Please sign in again.')
      return true
    }

    return false
  }, [handleLogout])

  useEffect(() => {
    function handlePopState() {
      setRoute(parseAppRoute(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!isPreviewModalOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsPreviewModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPreviewModalOpen])

  useEffect(() => {
    if (route.kind === 'editor' && route.templateId !== selectedTemplateIdRef.current) {
      setActiveTemplateId(route.templateId)
    }
  }, [route, setActiveTemplateId])

  useEffect(() => {
    if (!isAutoPreviewEnabled || !tenantId || !draft || !isPreviewStale || isRenderingPreview) {
      return
    }

    let isActive = true
    const previewSignature = getPreviewSignature(draft)
    const timer = window.setTimeout(async () => {
      setIsRenderingPreview(true)

      try {
        const response = await renderMjml(tenantId, {
          mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
          editorDocument: cloneEditorDocument(draft.editorDocument),
        })

        if (!isActive) {
          return
        }

        setRenderedHtml(response.html)
        setRenderIssues(response.issues)
        setPreviewMjmlSnapshot(previewSignature)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive || handleUnauthorized(error)) {
          return
        }

        resetPreview()
        setErrorMessage(getErrorMessage(error, 'Unable to render MJML preview.'))
      } finally {
        if (isActive) {
          setIsRenderingPreview(false)
        }
      }
    }, autoPreviewDelayMs)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [draft, handleUnauthorized, isAutoPreviewEnabled, isPreviewStale, isRenderingPreview, resetPreview, tenantId])

  useEffect(() => {
    const sections = draft?.editorDocument?.sections ?? []

    if (sections.length === 0) {
      setSelectedSectionId(null)
      setSelectedColumnId(null)
      setSelectedBlockId(null)
      return
    }

    const activeSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0]
    const activeColumn = activeSection.columns.find((column) => column.id === selectedColumnId) ?? activeSection.columns[0]
    const activeBlock = activeColumn?.blocks.find((block) => block.id === selectedBlockId) ?? activeColumn?.blocks[0] ?? null

    if (activeSection.id !== selectedSectionId) {
      setSelectedSectionId(activeSection.id)
    }

    if (activeColumn?.id !== selectedColumnId) {
      setSelectedColumnId(activeColumn?.id ?? null)
    }

    if (activeBlock?.id !== selectedBlockId) {
      setSelectedBlockId(activeBlock?.id ?? null)
    }

    if (!activeBlock && selectedBlockId) {
      setSelectedBlockId(null)
    }
  }, [draft?.editorDocument, selectedBlockId, selectedColumnId, selectedSectionId])

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      if (!getStoredAuthToken()) {
        if (isActive) {
          setIsAuthLoading(false)
        }
        return
      }

      try {
        const user = await getCurrentUser()

        if (!isActive) {
          return
        }

        setCurrentUser(user)
        setIsTenantsLoading(true)
        setErrorMessage(null)
      } catch {
        clearStoredAuthToken()
        if (isActive) {
          clearWorkspace()
        }
      } finally {
        if (isActive) {
          setIsAuthLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isActive = false
    }
  }, [clearWorkspace])

  useEffect(() => {
    if (!currentUser) {
      return
    }

    let isActive = true

    async function loadTenants() {
      try {
        const response = await listTenants()

        if (!isActive) {
          return
        }

        const previousTenantId = tenantIdRef.current
        const nextTenantId =
          previousTenantId && response.some((tenant) => tenant.id === previousTenantId)
            ? previousTenantId
            : response[0]?.id || ''

        setTenants(response)
        if (nextTenantId !== previousTenantId) {
          setActiveTemplateId(null)
          setSelectedTemplate(null)
          setDraft(null)
        }
        setIsTemplatesLoading(Boolean(nextTenantId))
        setActiveTenant(nextTenantId)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive || handleUnauthorized(error)) {
          return
        }

        setErrorMessage(getErrorMessage(error, 'Unable to load tenants.'))
      } finally {
        if (isActive) {
          setIsTenantsLoading(false)
        }
      }
    }

    void loadTenants()

    return () => {
      isActive = false
    }
  }, [currentUser, handleUnauthorized, refreshNonce, setActiveTemplateId, setActiveTenant])

  useEffect(() => {
    if (!currentUser || !tenantId) {
      return
    }

    let isActive = true

    async function loadTemplates() {
      try {
        const response = await listTemplates(tenantId)

        if (!isActive) {
          return
        }

        setTemplates(response)
        const currentTemplateId = selectedTemplateIdRef.current
        const nextTemplateId =
          currentTemplateId && response.some((template) => template.id === currentTemplateId)
            ? currentTemplateId
            : response[0]?.id ?? null

        if (response.length === 0) {
          setActiveTemplateId(null)
          setSelectedTemplate(null)
          setDraft(null)
        } else {
          setActiveTemplateId(nextTemplateId)
        }

        setErrorMessage(null)
      } catch (error) {
        if (!isActive || handleUnauthorized(error)) {
          return
        }

        setTemplates([])
        setActiveTemplateId(null)
        setErrorMessage(getErrorMessage(error, 'Unable to load templates for the selected tenant.'))
      } finally {
        if (isActive) {
          setIsTemplatesLoading(false)
        }
      }
    }

    void loadTemplates()

    return () => {
      isActive = false
    }
  }, [currentUser, handleUnauthorized, refreshNonce, setActiveTemplateId, tenantId])

  useEffect(() => {
    if (!currentUser || !tenantId || !selectedTemplateId) {
      return
    }

    const currentTemplateId = selectedTemplateId
    let isActive = true

    async function loadTemplate() {
      try {
        const response = await getTemplate(tenantId, currentTemplateId)

        if (!isActive) {
          return
        }

        setSelectedTemplate(response)
        setDraft(toDraft(response))
        setErrorMessage(null)
      } catch (error) {
        if (!isActive || handleUnauthorized(error)) {
          return
        }

        setSelectedTemplate(null)
        setDraft(null)
        setErrorMessage(getErrorMessage(error, 'Unable to load the selected template.'))
      } finally {
        if (isActive) {
          setIsTemplateLoading(false)
        }
      }
    }

    void loadTemplate()

    return () => {
      isActive = false
    }
  }, [currentUser, handleUnauthorized, refreshNonce, selectedTemplateId, tenantId])

  useEffect(() => {
    if (!currentUser || !tenantId || !selectedTemplateId) {
      return
    }

    const currentTemplateId = selectedTemplateId
    let isActive = true

    async function loadRevisions() {
      try {
        const response = await listTemplateRevisions(tenantId, currentTemplateId)

        if (!isActive) {
          return
        }

        setRevisions(response)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive || handleUnauthorized(error)) {
          return
        }

        setRevisions([])
        setErrorMessage(getErrorMessage(error, 'Unable to load template revision history.'))
      } finally {
        if (isActive) {
          setIsRevisionsLoading(false)
        }
      }
    }

    void loadRevisions()

    return () => {
      isActive = false
    }
  }, [currentUser, handleUnauthorized, revisionRefreshNonce, selectedTemplateId, tenantId])

  function selectTenant(nextTenantId: string) {
    setIsTemplatesLoading(true)
    setActiveTenant(nextTenantId)
    if (route.kind === 'editor') {
      navigateToRoute({ kind: 'library' }, true)
    }
    setActiveTemplateId(null)
    setSelectedTemplate(null)
    setDraft(null)
    resetPreview()
    setInfoMessage(null)
    setErrorMessage(null)
  }

  function openEditor(templateId: string) {
    navigateToRoute({ kind: 'editor', templateId })
    setActiveTemplateId(templateId)
    setInfoMessage(null)
    setErrorMessage(null)
  }

  function returnToLibrary() {
    navigateToRoute({ kind: 'library' })
    setInfoMessage(null)
    setErrorMessage(null)
  }

  function handleRefreshWorkspace() {
    setIsTenantsLoading(true)
    setIsTemplatesLoading(Boolean(tenantIdRef.current))
    setIsTemplateLoading(Boolean(selectedTemplateIdRef.current))
    setInfoMessage('Refreshing tenants and templates from the API.')
    setErrorMessage(null)
    setRefreshNonce((current) => current + 1)
  }

  function updateDraft(field: keyof TemplateDraft, value: string) {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const nextDraft = { ...current, [field]: value }

      if (field !== 'status' && current.status === 'Published') {
        nextDraft.status = 'Draft'
      }

      return nextDraft
    })
  }

  function handleInsertMjmlSnippet(snippet: string) {
    if (!draft || draft.editorDocument) {
      return
    }

    const editor = mjmlEditorRef.current
    const selectionStart = editor?.selectionStart ?? draft.mjmlBody.length
    const selectionEnd = editor?.selectionEnd ?? draft.mjmlBody.length
    const nextValue = `${draft.mjmlBody.slice(0, selectionStart)}${snippet}${draft.mjmlBody.slice(selectionEnd)}`

    updateDraft('mjmlBody', nextValue)

    window.requestAnimationFrame(() => {
      if (!mjmlEditorRef.current) {
        return
      }

      const nextCursorPosition = selectionStart + snippet.length
      mjmlEditorRef.current.focus()
      mjmlEditorRef.current.selectionStart = nextCursorPosition
      mjmlEditorRef.current.selectionEnd = nextCursorPosition
    })
  }

  function updateEditorDocument(updater: (current: EditorDocument) => EditorDocument) {
    setDraft((current) => {
      if (!current || !current.editorDocument) {
        return current
      }

      const nextDraft = {
        ...current,
        editorDocument: updater(cloneEditorDocument(current.editorDocument) ?? current.editorDocument),
      }

      if (current.status === 'Published') {
        nextDraft.status = 'Draft'
      }

      return nextDraft
    })
  }

  function handleStartBuilder(preset: BuilderPreset = 'hero') {
    setDraft((current) => {
      if (!current) {
        return current
      }

      const nextDraft = {
        ...current,
        editorDocument: {
          version: 1,
          sections: createPresetSections(preset),
        },
      }

      if (current.status === 'Published') {
        nextDraft.status = 'Draft'
      }

      return nextDraft
    })
    setActiveBuilderTab('blocks')
  }

  function handleAddSection(columnCount: number) {
    if (!draft?.editorDocument) {
      setDraft((current) => current
        ? {
            ...current,
            status: current.status === 'Published' ? 'Draft' : current.status,
            editorDocument: {
              version: 1,
              sections: [createSection(columnCount)],
            },
          }
        : current)
      setActiveBuilderTab('sections')
      return
    }

    updateEditorDocument((current) => ({
      ...current,
      sections: [...current.sections, createSection(columnCount)],
    }))
    setActiveBuilderTab('sections')
  }

  function handleAddPresetSection(preset: BuilderPreset) {
    if (!draft?.editorDocument) {
      handleStartBuilder(preset)
      return
    }

    updateEditorDocument((current) => ({
      ...current,
      sections: [...current.sections, ...createPresetSections(preset)],
    }))
    setActiveBuilderTab('presets')
  }

  function handleAddBlock(type: EditorBlockType) {
    if (!draft?.editorDocument) {
      return
    }

    const targetSection = draft.editorDocument.sections.find((section) => section.id === selectedSectionId)
      ?? draft.editorDocument.sections[0]

    const targetSectionId = targetSection?.id
    const targetColumnId = targetSection?.columns.find((column) => column.id === selectedColumnId)?.id
      ?? targetSection?.columns[0]?.id

    if (!targetSectionId || !targetColumnId) {
      return
    }

    const nextBlock = createDefaultBlock(type)
    updateEditorDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== targetSectionId) {
          return section
        }

        return {
          ...section,
          columns: section.columns.map((column) => (
            column.id === targetColumnId
              ? { ...column, blocks: [...column.blocks, nextBlock] }
              : column
          )),
        }
      }),
    }))
    setSelectedSectionId(targetSectionId)
    setSelectedColumnId(targetColumnId)
    setSelectedBlockId(nextBlock.id)
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

  function handleUpdateSection(changes: Partial<EditorSection>) {
    if (!selectedSectionId) {
      return
    }

    updateEditorDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => (
        section.id === selectedSectionId
          ? { ...section, ...changes }
          : section
      )),
    }))
  }

  function handleUpdateSelectedColumnWidth(nextWidth: number | null) {
    if (!selectedSectionId || !selectedColumnId || nextWidth === null) {
      return
    }

    updateEditorDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== selectedSectionId) {
          return section
        }

        const columnCount = section.columns.length
        const otherColumnCount = columnCount - 1

        if (otherColumnCount <= 0) {
          return {
            ...section,
            columns: section.columns.map((column) => (
              column.id === selectedColumnId
                ? { ...column, widthPercentage: 100 }
                : column
            )),
          }
        }

        const boundedWidth = Math.max(1, Math.min(nextWidth, 100 - otherColumnCount))
        const remainingWidth = 100 - boundedWidth
        const baseWidth = Math.floor(remainingWidth / otherColumnCount)
        let remainder = remainingWidth - (baseWidth * otherColumnCount)

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id === selectedColumnId) {
              return { ...column, widthPercentage: boundedWidth }
            }

            const widthPercentage = baseWidth + (remainder > 0 ? 1 : 0)
            remainder = Math.max(0, remainder - 1)
            return { ...column, widthPercentage }
          }),
        }
      }),
    }))
  }

  function handleUpdateSelectedBlock(changes: Partial<EditorBlock>) {
    if (!selectedSectionId || !selectedColumnId || !selectedBlockId) {
      return
    }

    updateEditorDocument((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== selectedSectionId) {
          return section
        }

        return {
          ...section,
          columns: section.columns.map((column) => ({
            ...column,
            blocks: column.id !== selectedColumnId
              ? column.blocks
              : column.blocks.map((block) => (
                  block.id === selectedBlockId ? { ...block, ...changes } : block
                )),
          })),
        }
      }),
    }))
  }

  function clearDragState() {
    setDraggedSectionId(null)
    setDraggedBlock(null)
    setSectionDropTargetId(null)
    setColumnDropTargetId(null)
    setBlockDropTargetId(null)
  }

  function handleSectionDragStart(sectionId: string) {
    setDraggedSectionId(sectionId)
    setDraggedBlock(null)
    setSectionDropTargetId(null)
    setColumnDropTargetId(null)
    setBlockDropTargetId(null)
  }

  function handleSectionDrop(targetSectionId: string) {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      clearDragState()
      return
    }

    updateEditorDocument((current) => {
      const fromIndex = current.sections.findIndex((section) => section.id === draggedSectionId)
      const toIndex = current.sections.findIndex((section) => section.id === targetSectionId)

      return {
        ...current,
        sections: moveItem(current.sections, fromIndex, toIndex),
      }
    })

    clearDragState()
  }

  function handleBlockDragStart(sectionId: string, columnId: string, blockId: string) {
    setDraggedBlock({ sectionId, columnId, blockId })
    setDraggedSectionId(null)
    setSectionDropTargetId(null)
    setColumnDropTargetId(null)
    setBlockDropTargetId(null)
  }

  function handleBlockDropOnBlock(targetSectionId: string, targetColumnId: string, targetBlockId: string) {
    if (!draggedBlock || draggedBlock.blockId === targetBlockId) {
      clearDragState()
      return
    }

    updateEditorDocument((current) => {
      let movedBlock: EditorBlock | null = null

      const sectionsWithoutDraggedBlock = current.sections.map((section) => ({
        ...section,
        columns: section.columns.map((column) => {
          if (section.id !== draggedBlock.sectionId || column.id !== draggedBlock.columnId) {
            return column
          }

          const nextBlocks = column.blocks.filter((block) => {
            if (block.id === draggedBlock.blockId) {
              movedBlock = block
              return false
            }

            return true
          })

          return {
            ...column,
            blocks: nextBlocks,
          }
        }),
      }))

      if (!movedBlock) {
        return current
      }

      const blockToMove = movedBlock

      return {
        ...current,
        sections: sectionsWithoutDraggedBlock.map((section) => ({
          ...section,
          columns: section.columns.map((column) => {
            if (section.id !== targetSectionId || column.id !== targetColumnId) {
              return column
            }

            const insertIndex = column.blocks.findIndex((block) => block.id === targetBlockId)
            const nextBlocks = [...column.blocks]
            nextBlocks.splice(insertIndex < 0 ? nextBlocks.length : insertIndex, 0, blockToMove)

            return {
              ...column,
              blocks: nextBlocks,
            }
          }),
        })),
      }
    })

    setSelectedSectionId(targetSectionId)
    setSelectedColumnId(targetColumnId)
    setSelectedBlockId(draggedBlock.blockId)
    clearDragState()
  }

  function handleBlockDropOnColumn(targetSectionId: string, targetColumnId: string) {
    if (!draggedBlock) {
      clearDragState()
      return
    }

    updateEditorDocument((current) => {
      let movedBlock: EditorBlock | null = null

      const sectionsWithoutDraggedBlock = current.sections.map((section) => ({
        ...section,
        columns: section.columns.map((column) => {
          if (section.id !== draggedBlock.sectionId || column.id !== draggedBlock.columnId) {
            return column
          }

          const nextBlocks = column.blocks.filter((block) => {
            if (block.id === draggedBlock.blockId) {
              movedBlock = block
              return false
            }

            return true
          })

          return {
            ...column,
            blocks: nextBlocks,
          }
        }),
      }))

      if (!movedBlock) {
        return current
      }

      const blockToMove = movedBlock

      return {
        ...current,
        sections: sectionsWithoutDraggedBlock.map((section) => ({
          ...section,
          columns: section.columns.map((column) => {
            if (section.id !== targetSectionId || column.id !== targetColumnId) {
              return column
            }

            return {
              ...column,
              blocks: [...column.blocks, blockToMove],
            }
          }),
        })),
      }
    })

    setSelectedSectionId(targetSectionId)
    setSelectedColumnId(targetColumnId)
    setSelectedBlockId(draggedBlock.blockId)
    clearDragState()
  }

  async function handleLogin() {
    setIsAuthenticating(true)
    setInfoMessage(null)

    try {
      clearWorkspace()
      const response = await login({
        email: loginEmail,
        password: loginPassword,
      })

      setCurrentUser(response.user)
      setIsTenantsLoading(true)
      setErrorMessage(null)
      setInfoMessage(`Signed in as ${response.user.displayName}.`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Unable to sign in.'))
    } finally {
      setIsAuthenticating(false)
      setIsAuthLoading(false)
    }
  }

  async function handleRenderPreview() {
    if (!tenantId || !draft) {
      return
    }

    setIsRenderingPreview(true)

    try {
      const previewSignature = getPreviewSignature(draft)
      const response = await renderMjml(tenantId, {
        mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
        editorDocument: cloneEditorDocument(draft.editorDocument),
      })
      setRenderedHtml(response.html)
      setRenderIssues(response.issues)
      setPreviewMjmlSnapshot(previewSignature)
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      resetPreview()
      setErrorMessage(getErrorMessage(error, 'Unable to render MJML preview.'))
    } finally {
      setIsRenderingPreview(false)
    }
  }

  function syncTemplateState(updated: TemplateDto, previousPreviewSignature?: string) {
    const nextDraft = toDraft(updated)

    setSelectedTemplate(updated)
    setDraft(nextDraft)
    setTemplates((current) =>
      current.map((template) => (template.id === updated.id ? toSummary(updated) : template))
    )

    if (previousPreviewSignature) {
      setPreviewMjmlSnapshot((current) =>
        current === previousPreviewSignature ? getPreviewSignature(nextDraft) : current
      )
    }
  }

  function handleOpenPreviewModal() {
    if (!renderedHtml) {
      setInfoMessage('Render a preview first, then open the expanded preview.')
      setErrorMessage(null)
      return
    }

    setPreviewViewport('desktop')
    setIsPreviewModalOpen(true)
    setErrorMessage(null)
  }

  function handleOpenPreviewInBrowser() {
    if (!renderedHtml) {
      setInfoMessage('Render a preview first, then open it in the browser.')
      setErrorMessage(null)
      return
    }

    const previewWindow = window.open('', '_blank')

    if (!previewWindow) {
      setErrorMessage('Unable to open the preview in a new window. Allow pop-ups and try again.')
      return
    }

    previewWindow.document.open()
    previewWindow.document.write(renderedHtml)
    previewWindow.document.close()
    previewWindow.document.title = `${selectedTemplate?.name ?? draft?.name ?? 'MJML'} preview`
  }

  const previewModal = renderedHtml && isPreviewModalOpen
    ? (
        <PreviewModal
          renderedHtml={renderedHtml}
          templateName={selectedTemplate?.name ?? draft?.name ?? 'MJML preview'}
          renderIssues={renderIssues}
          isPreviewStale={isPreviewStale}
          previewViewport={previewViewport}
          onClose={() => setIsPreviewModalOpen(false)}
          onOpenInBrowser={handleOpenPreviewInBrowser}
          onSelectViewport={setPreviewViewport}
        />
      )
    : null

  async function handleCreateTemplate() {
    if (!tenantId) {
      return
    }

    setIsCreating(true)
    setInfoMessage(null)

    try {
      const created = await createTemplate(tenantId, {
        name: 'Untitled campaign',
        subject: 'New marketing email',
        mjmlBody: createStarterMjml(),
      })

      setTemplates((current) => [toSummary(created), ...current])
      setActiveTemplateId(created.id)
      setSelectedTemplate(created)
      setDraft(toDraft(created))
      resetPreview()
      setInfoMessage('New draft created.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to create a new template.'))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDuplicateTemplate() {
    if (!tenantId || !draft) {
      return
    }

    setIsCreating(true)
    setInfoMessage(null)

    try {
      const created = await createTemplate(tenantId, {
        name: `${draft.name} copy`,
        subject: draft.subject,
        mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
        editorDocument: cloneEditorDocument(draft.editorDocument),
      })

      setTemplates((current) => [toSummary(created), ...current])
      setActiveTemplateId(created.id)
      setSelectedTemplate(created)
      setDraft(toDraft(created))
      resetPreview()
      setInfoMessage('Template duplicated.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to duplicate the selected template.'))
    } finally {
      setIsCreating(false)
    }
  }

  async function handleSaveTemplate() {
    if (!tenantId || !selectedTemplate || !draft || !hasUnsavedChanges) {
      return
    }

    setIsSaving(true)
    setInfoMessage(null)

    try {
      const previousPreviewSignature = getPreviewSignature(draft)
      const updated = await updateTemplate(tenantId, selectedTemplate.id, {
        ...draft,
        mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
        editorDocument: cloneEditorDocument(draft.editorDocument),
      })
      syncTemplateState(updated, previousPreviewSignature)
      setRevisionRefreshNonce((current) => current + 1)
      setInfoMessage('Template changes saved.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to save the selected template.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteTemplate() {
    if (!tenantId || !selectedTemplate) {
      return
    }

    setIsDeleting(true)
    setInfoMessage(null)

    try {
      await deleteTemplate(tenantId, selectedTemplate.id)

      const remainingTemplates = templates.filter((template) => template.id !== selectedTemplate.id)
      setTemplates(remainingTemplates)
      setActiveTemplateId(remainingTemplates[0]?.id ?? null)
      setSelectedTemplate(null)
      setDraft(null)
      resetPreview()
      if (route.kind === 'editor') {
        navigateToRoute({ kind: 'library' }, true)
      }
      setInfoMessage('Template deleted.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to delete the selected template.'))
    } finally {
      setIsDeleting(false)
    }
  }

  async function handlePublishTemplate() {
    if (!tenantId || !selectedTemplate || !draft) {
      return
    }

    setIsPublishing(true)
    setInfoMessage(null)

    try {
      const previousPreviewSignature = getPreviewSignature(draft)
      const templateToPublish = hasUnsavedChanges
        ? await updateTemplate(tenantId, selectedTemplate.id, {
            ...draft,
            mjmlBody: draft.editorDocument ? '' : draft.mjmlBody,
            editorDocument: cloneEditorDocument(draft.editorDocument),
          })
        : selectedTemplate

      const published = await publishTemplate(tenantId, templateToPublish.id)

      syncTemplateState(published, previousPreviewSignature)
      setRevisionRefreshNonce((current) => current + 1)
      setInfoMessage(hasUnsavedChanges ? 'Template changes saved and published.' : 'Template published.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to publish the selected template.'))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleRollbackTemplate(revisionId: string) {
    if (!tenantId || !selectedTemplate) {
      return
    }

    if (hasUnsavedChanges) {
      setInfoMessage('Save or publish your current draft before rolling back to an older revision.')
      setErrorMessage(null)
      return
    }

    setIsRollingBackRevisionId(revisionId)
    setInfoMessage(null)

    try {
      const updated = await rollbackTemplate(tenantId, selectedTemplate.id, revisionId)

      syncTemplateState(updated)
      resetPreview()
      setRevisionRefreshNonce((current) => current + 1)
      setInfoMessage('Template rolled back to the selected revision.')
      setErrorMessage(null)
    } catch (error) {
      if (handleUnauthorized(error)) {
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to roll back the selected template revision.'))
    } finally {
      setIsRollingBackRevisionId(null)
    }
  }

  if (!isAuthLoading && currentUser && isEditorRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col">
          <header className="border-b border-white/10 bg-slate-950/90 px-6 py-5 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={returnToLibrary}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                >
                  Back to library
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                    Email builder
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">
                    {selectedTemplate?.name ?? 'Loading template'}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isAutoPreviewEnabled}
                    onChange={(event) => setIsAutoPreviewEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400 focus:ring-sky-400/40"
                  />
                  Auto refresh preview
                </label>
                <button
                  type="button"
                  onClick={() => void handleRenderPreview()}
                  disabled={!draft || isRenderingPreview}
                  className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {isRenderingPreview ? 'Rendering…' : 'Render preview'}
                </button>
                <button
                  type="button"
                  onClick={() => void handlePublishTemplate()}
                  disabled={!selectedTemplate || isPublishing || isSaving || isTemplateLoading || isRollingBackRevisionId !== null}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  {getPublishButtonLabel(hasUnsavedChanges, isPublishing)}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveTemplate()}
                  disabled={!hasUnsavedChanges || isSaving || isTemplateLoading}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
                </button>
              </div>
            </div>

            {(errorMessage || infoMessage) && (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  errorMessage
                    ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                    : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                }`}
              >
                {errorMessage ?? infoMessage}
              </div>
            )}
          </header>

          <main className="flex-1 px-6 py-6 lg:px-8">
            {selectedTemplate && draft ? (
              <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_380px]">
                <BuilderSidebar
                  draft={draft}
                  selectedTemplate={selectedTemplate}
                  activeBuilderTab={activeBuilderTab}
                  setActiveBuilderTab={setActiveBuilderTab}
                  selectedSection={selectedSection}
                  selectedColumn={selectedColumn}
                  selectedBlock={selectedBlock}
                  selectedSectionId={selectedSectionId}
                  selectedColumnId={selectedColumnId}
                  updateDraft={updateDraft}
                  handleAddBlock={handleAddBlock}
                  handleAddSection={handleAddSection}
                  handleAddPresetSection={handleAddPresetSection}
                  handleUpdateSection={handleUpdateSection}
                  handleUpdateSelectedColumnWidth={handleUpdateSelectedColumnWidth}
                  handleUpdateSelectedBlock={handleUpdateSelectedBlock}
                  handleSelectSection={handleSelectSection}
                  handleSelectColumn={handleSelectColumn}
                  handleStartBuilder={handleStartBuilder}
                />

                <BuilderCanvas
                  draft={draft}
                  selectedSectionId={selectedSectionId}
                  selectedColumnId={selectedColumnId}
                  selectedBlockId={selectedBlockId}
                  draggedSectionId={draggedSectionId}
                  draggedBlock={draggedBlock}
                  sectionDropTargetId={sectionDropTargetId}
                  columnDropTargetId={columnDropTargetId}
                  blockDropTargetId={blockDropTargetId}
                  handleSelectSection={handleSelectSection}
                  handleSelectColumn={handleSelectColumn}
                  handleSelectBlock={handleSelectBlock}
                  handleSectionDragStart={handleSectionDragStart}
                  handleSectionDrop={handleSectionDrop}
                  handleBlockDragStart={handleBlockDragStart}
                  handleBlockDropOnColumn={handleBlockDropOnColumn}
                  handleBlockDropOnBlock={handleBlockDropOnBlock}
                  setSectionDropTargetId={setSectionDropTargetId}
                  setColumnDropTargetId={setColumnDropTargetId}
                  setBlockDropTargetId={setBlockDropTargetId}
                  clearDragState={clearDragState}
                  handleStartBuilder={handleStartBuilder}
                  handleAddSection={handleAddSection}
                />

                <aside className="space-y-6">
                  <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      HTML preview
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Render the current builder layout or MJML fallback through the backend conversion service.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleOpenPreviewModal}
                        disabled={!renderedHtml || isRenderingPreview}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                      >
                        Expand preview
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenPreviewInBrowser}
                        disabled={!renderedHtml || isRenderingPreview}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                      >
                        Open in browser
                      </button>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white">
                      {isRenderingPreview ? (
                        <PreviewSkeleton />
                      ) : renderedHtml ? (
                        <iframe
                          title="MJML HTML preview"
                          srcDoc={renderedHtml}
                          sandbox=""
                          className="min-h-[420px] w-full bg-white"
                        />
                      ) : (
                        <div className="flex min-h-[220px] items-center justify-center bg-slate-950/95 px-6 text-center">
                          <div>
                            <p className="text-base font-medium text-white">Preview not rendered yet</p>
                            <p className="mt-2 text-sm text-slate-400">
                              Run the renderer to see the current template draft as email HTML.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">{renderIssues.length}</span>
                      {' '}
                      render issue{renderIssues.length === 1 ? '' : 's'}
                      {isPreviewStale && (
                        <span className="ml-2 text-amber-200">for the last rendered draft</span>
                      )}
                      {isAutoPreviewEnabled && (
                        <span className="ml-2 text-sky-200">auto refresh on</span>
                      )}
                    </div>

                    {renderIssues.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                        <p className="text-sm font-semibold text-amber-100">Render feedback</p>
                        <ul className="mt-3 space-y-2 text-sm text-amber-50/90">
                          {renderIssues.map((issue, index) => (
                            <li key={`${issue.type}-${issue.message}-${index}`} className="rounded-2xl bg-black/10 px-3 py-2">
                              <span className="font-semibold text-amber-100">{issue.type}</span>
                              {' '}
                              {issue.message}
                              {formatIssueLocation(issue) && (
                                <span className="ml-2 text-xs text-amber-200/80">
                                  {formatIssueLocation(issue)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      MJML snapshot
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {draft.editorDocument
                        ? 'This is the last saved MJML snapshot. Unsaved canvas changes render correctly in preview, but the stored MJML updates when you save.'
                        : 'This template is still using raw MJML as its primary source.'}
                    </p>
                    <textarea
                      value={draft.mjmlBody}
                      readOnly
                      className="mt-4 min-h-[220px] w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                    />
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-black/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Revision history
                    </p>
                    <div className="mt-4 space-y-3">
                      {hasUnsavedChanges && (
                        <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          Save or publish the current draft before rolling back to a stored revision.
                        </p>
                      )}
                      {isRevisionsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((value) => (
                            <div
                              key={value}
                              className="h-24 animate-pulse rounded-2xl border border-white/10 bg-slate-950/50"
                            />
                          ))}
                        </div>
                      ) : revisions.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                          No revisions available yet.
                        </p>
                      ) : (
                        revisions.map((revision) => (
                          <div
                            key={revision.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-white">
                                    Revision {revision.revisionNumber}
                                  </span>
                                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                    {revision.eventType}
                                  </span>
                                  {revision.isPublishedRevision && (
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                                      Live
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm text-slate-300">{revision.subject}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatTimestamp(revision.createdAtUtc)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleRollbackTemplate(revision.id)}
                                disabled={hasUnsavedChanges || isSaving || isPublishing || isRollingBackRevisionId === revision.id}
                                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                              >
                                {isRollingBackRevisionId === revision.id ? 'Rolling back…' : 'Rollback'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
                  <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-900/40 px-6 py-12 text-center">
                    <p className="text-base font-medium text-white">
                      {isTemplateLoading ? 'Loading editor…' : 'Template not found'}
                    </p>
                <p className="mt-2 text-sm text-slate-400">
                  Return to the template library and pick a template to continue editing.
                </p>
              </div>
            )}
          </main>
          {previewModal}
        </div>
      </div>
    )
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-8 py-6 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-sky-300">MJML editor</p>
          <p className="mt-3 text-lg font-semibold text-white">Restoring your session…</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
          <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
              MJML editor
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Sign in to Template Studio</h1>
            <p className="mt-3 text-sm text-slate-400">
              JWT auth is now required. Choose a seeded demo user or enter credentials manually.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin@demo.local')
                  setLoginPassword('Password123!')
                }}
                className="w-full rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-left text-sm text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15"
              >
                <span className="block font-semibold">Use Demo Admin</span>
                <span className="mt-1 block text-xs text-sky-100/80">Access to all seeded tenants</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('editor@demo.local')
                  setLoginPassword('Password123!')
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-slate-900"
              >
                <span className="block font-semibold">Use Tenant Editor</span>
                <span className="mt-1 block text-xs text-slate-400">Restricted to the first seeded tenant</span>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Email
                </span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Password
                </span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                />
              </label>

              {(errorMessage || infoMessage) && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    errorMessage
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                      : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {errorMessage ?? infoMessage}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleLogin()}
                disabled={isAuthenticating}
                className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {isAuthenticating ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-slate-900/40 p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">What changed</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard
                title="Server-enforced tenancy"
                body="X-Tenant now acts as a selector only after the API confirms the authenticated user belongs to that tenant."
              />
              <InfoCard
                title="Local JWT auth"
                body="The API now issues bearer tokens for local users and protects tenant/template endpoints."
              />
              <InfoCard
                title="Seeded demo users"
                body="Run the seed project to create demo users and memberships alongside tenants and templates."
              />
              <InfoCard
                title="Current source of truth"
                body="MJML remains the editable source while rendered HTML stays a server-side preview output."
              />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6">
              <p className="text-sm font-semibold text-white">Seed command</p>
              <code className="mt-3 block rounded-2xl bg-black/30 px-4 py-3 text-xs text-sky-100">
                {seedCommand}
              </code>
              <p className="mt-4 text-sm text-slate-400">
                Demo credentials:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><span className="font-semibold text-white">admin@demo.local</span> / Password123!</li>
                <li><span className="font-semibold text-white">editor@demo.local</span> / Password123!</li>
              </ul>
              <code className="mt-4 block rounded-2xl bg-black/30 px-4 py-3 text-xs text-sky-100">
                {seedOverrideCommand}
              </code>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-slate-950/80 px-5 py-6 backdrop-blur lg:min-h-screen lg:w-80 lg:border-r lg:border-b-0 lg:px-6">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                MJML editor
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">
                Template studio
              </h1>
              <p className="mt-2 max-w-xs text-sm text-slate-400">
                Tailwind-powered workspace wired to JWT auth and the tenant-aware API.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleCreateTemplate()}
              disabled={!tenantId || isCreating}
              className="hidden rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 lg:inline-flex"
            >
              {isCreating ? 'Creating…' : 'New template'}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Signed in as
            </p>
            <p className="mt-3 text-sm font-semibold text-white">{currentUser.displayName}</p>
            <p className="mt-1 text-xs text-slate-400">{currentUser.email}</p>
            <p className="mt-3 text-xs text-slate-500">
              {currentUser.memberships.length} accessible tenant{currentUser.memberships.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => handleLogout('Signed out.')}
              className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Sign out
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Active tenant
            </p>
            <div className="mt-4 space-y-2">
              {isTenantsLoading ? (
                <TenantSkeleton />
              ) : tenants.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                  No tenants available for this user.
                </p>
              ) : (
                tenants.map((tenant) => {
                  const isActive = tenant.id === tenantId

                  return (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => selectTenant(tenant.id)}
                      className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-sky-400/60 bg-sky-500/12 text-white shadow-lg shadow-sky-500/10'
                          : 'border-white/10 bg-slate-950/50 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{tenant.name}</span>
                        <span className="mt-1 block text-xs text-slate-400">{tenant.id}</span>
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">
                        {isActive ? 'Active' : 'Select'}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  item.active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {item.count ?? counts.total}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-200">Auth contract</p>
            <p className="mt-2 text-sm text-emerald-50/80">
              Bearer auth establishes who you are. 
              {' '}
              <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs text-emerald-100">
                X-Tenant: {tenantId || '…'}
              </code>
              {' '}
              only chooses among your allowed tenants.
            </p>
            <p className="mt-3 text-xs text-emerald-100/80">
              API base:
              {' '}
              <span className="font-medium text-emerald-100">{apiBaseUrl}</span>
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
            <p className="text-sm font-semibold text-sky-100">Seeded dev flow</p>
            <p className="mt-2 text-sm text-sky-50/80">
              Bring up the local stack, run the seed project, sign in with a demo user, then refresh this workspace to pull the latest tenant and template data.
            </p>
            <div className="mt-4 space-y-3 text-xs text-sky-50/85">
              <div>
                <p className="font-semibold uppercase tracking-[0.2em] text-sky-200">Seed command</p>
                <code className="mt-1 block rounded-2xl bg-slate-950/70 px-3 py-2 text-[11px] text-sky-100">
                  {seedCommand}
                </code>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-[0.2em] text-sky-200">Demo credentials</p>
                <code className="mt-1 block rounded-2xl bg-slate-950/70 px-3 py-2 text-[11px] text-sky-100">
                  admin@demo.local / Password123!
                </code>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/65 shadow-2xl shadow-black/30 backdrop-blur">
            <header className="border-b border-white/10 px-6 py-5 lg:px-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Template management workspace</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                    {activeTenant?.name ?? 'Templates'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    Authenticated access is now required before the app loads tenant-scoped template data.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRefreshWorkspace}
                    disabled={isTenantsLoading || isTemplatesLoading || isTemplateLoading}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                  >
                    Refresh data
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDuplicateTemplate()}
                    disabled={!draft || isCreating}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                  >
                    {isCreating ? 'Duplicating…' : 'Duplicate selected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateTemplate()}
                    disabled={!tenantId || isCreating}
                    className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {isCreating ? 'Creating…' : 'Create template'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total templates" value={counts.total} accent="sky" />
                <MetricCard label="Drafts" value={counts.draft} accent="amber" />
                <MetricCard label="Published" value={counts.published} accent="emerald" />
                <MetricCard label="Archived" value={counts.archived} accent="slate" />
              </div>

              {(errorMessage || infoMessage) && (
                <div
                  className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                    errorMessage
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                      : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {errorMessage ?? infoMessage}
                </div>
              )}
            </header>

            <section className="border-b border-white/10 px-6 py-5 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-col gap-3 md:flex-row">
                  <label className="flex-1">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Search templates
                    </span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name or subject"
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </label>
                  <label className="md:w-56">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Status
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value="All">All statuses</option>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                  Showing
                  {' '}
                  <span className="font-semibold text-white">{filteredTemplates.length}</span>
                  {' '}
                  of
                  {' '}
                  <span className="font-semibold text-white">{templates.length}</span>
                  {' '}
                  templates for
                  {' '}
                  <span className="font-semibold text-sky-300">{tenantId || '—'}</span>
                </div>
              </div>
            </section>

            <section className="grid gap-0 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
              <div className="border-b border-white/10 p-6 xl:border-r xl:border-b-0 xl:p-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Template list</h3>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {activeTenant?.id ?? 'No tenant'}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {isTemplatesLoading ? (
                    <TemplateListSkeleton />
                  ) : filteredTemplates.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-10 text-center">
                      <p className="text-base font-medium text-white">
                        {hasActiveFilters ? 'No templates match this filter.' : 'No templates available yet.'}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {hasActiveFilters
                          ? 'Clear the search or change the status filter to widen the result set.'
                          : 'Run the seed project or create a new draft for this tenant.'}
                      </p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => {
                      const isSelected = template.id === selectedTemplate?.id

                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setActiveTemplateId(template.id)}
                          className={`w-full rounded-3xl border px-5 py-4 text-left transition ${
                            isSelected
                              ? 'border-sky-400/60 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                              : 'border-white/10 bg-slate-900/45 hover:border-white/20 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-white">{template.name}</p>
                              <p className="mt-1 text-sm text-slate-400">{template.subject}</p>
                            </div>
                            <StatusPill status={template.status} />
                          </div>

                          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                            <span>{template.id}</span>
                            <span>Updated {formatTimestamp(template.updatedAtUtc)}</span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="p-6 xl:p-8">
                {selectedTemplate && draft ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          Editor
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          {selectedTemplate.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">
                          Save creates a new draft revision. Publish marks the current revision as live for this tenant.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <StatusPill status={selectedTemplate.status} />
                          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                            Revision {selectedTemplate.currentRevisionNumber}
                          </span>
                        </div>
                      </div>

                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={isAutoPreviewEnabled}
                              onChange={(event) => setIsAutoPreviewEnabled(event.target.checked)}
                              className="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400 focus:ring-sky-400/40"
                            />
                            Auto refresh preview
                          </label>
                          <button
                            type="button"
                            onClick={() => openEditor(selectedTemplate.id)}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                        >
                          Open builder
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRenderPreview()}
                          disabled={!draft || isRenderingPreview}
                          className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-slate-800 disabled:text-slate-500"
                        >
                          {isRenderingPreview ? 'Rendering…' : 'Render preview'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handlePublishTemplate()}
                          disabled={isPublishing || isSaving || isTemplateLoading || isRollingBackRevisionId !== null}
                          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-300/50 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-slate-800 disabled:text-slate-500"
                        >
                          {getPublishButtonLabel(hasUnsavedChanges, isPublishing)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveTemplate()}
                          disabled={!hasUnsavedChanges || isSaving || isTemplateLoading}
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                          {isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteTemplate()}
                          disabled={isDeleting}
                          className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300/50 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-slate-800 disabled:text-slate-500"
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </div>

                    {isTemplateLoading ? (
                      <EditorSkeleton />
                    ) : (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Template name
                            </span>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(event) => updateDraft('name', event.target.value)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Status
                            </span>
                            <select
                              value={draft.status === 'Published' ? 'Draft' : draft.status}
                              onChange={(event) => updateDraft('status', event.target.value as TemplateStatus)}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </label>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Subject line
                          </span>
                          <input
                            type="text"
                            value={draft.subject}
                            onChange={(event) => updateDraft('subject', event.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                          />
                        </label>

                        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              MJML source
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                              {draft.editorDocument
                                ? 'This template now has a builder document. Open the dedicated builder to change the layout; the MJML below is the current stored snapshot.'
                                : 'Edit the template source directly here, or open the dedicated builder page to start a visual layout.'}
                            </p>
                          </div>

                          {!draft.editorDocument && (
                            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-white">Quick insert snippets</p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    Drop in common MJML structures at the current cursor position.
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {mjmlSnippetOptions.map((snippet) => (
                                    <button
                                      key={snippet.id}
                                      type="button"
                                      onClick={() => handleInsertMjmlSnippet(snippet.snippet)}
                                      className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                                    >
                                      {snippet.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          <label className="mt-5 block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              MJML markup
                            </span>
                            <textarea
                              ref={mjmlEditorRef}
                              value={draft.mjmlBody}
                              onChange={(event) => updateDraft('mjmlBody', event.target.value)}
                              disabled={draft.editorDocument !== null}
                              className="min-h-[280px] w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                HTML preview
                              </p>
                              <p className="mt-2 text-sm text-slate-400">
                                Render the current builder layout or MJML draft through the backend conversion service.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPreviewStale && (
                                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                                  Preview out of date
                                </span>
                              )}
                              {isAutoPreviewEnabled && (
                                <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">
                                  Auto refresh on
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => void handleRenderPreview()}
                                disabled={isRenderingPreview}
                                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                              >
                                {isRenderingPreview ? 'Rendering…' : 'Refresh preview'}
                              </button>
                              <button
                                type="button"
                                onClick={handleOpenPreviewModal}
                                disabled={!renderedHtml || isRenderingPreview}
                                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                              >
                                Expand preview
                              </button>
                              <button
                                type="button"
                                onClick={handleOpenPreviewInBrowser}
                                disabled={!renderedHtml || isRenderingPreview}
                                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                              >
                                Open in browser
                              </button>
                            </div>
                          </div>

                          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white">
                            {isRenderingPreview ? (
                              <PreviewSkeleton />
                            ) : renderedHtml ? (
                              <iframe
                                title="MJML HTML preview"
                                srcDoc={renderedHtml}
                                sandbox=""
                                className="min-h-[420px] w-full bg-white"
                              />
                            ) : (
                              <div className="flex min-h-[220px] items-center justify-center bg-slate-950/95 px-6 text-center">
                                <div>
                                  <p className="text-base font-medium text-white">Preview not rendered yet</p>
                                  <p className="mt-2 text-sm text-slate-400">
                                    Run the renderer to see the current template draft as email HTML.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                                <span className="font-semibold text-white">{renderIssues.length}</span>
                                {' '}
                              render issue{renderIssues.length === 1 ? '' : 's'}
                              {isPreviewStale && (
                                <span className="ml-2 text-amber-200">for the last rendered draft</span>
                              )}
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                                {draft.editorDocument
                                  ? 'Preview uses the current builder layout, even before it has been saved back to MJML.'
                                  : 'Preview uses the current MJML draft and the server-side renderer, so rendering again after edits will refresh exactly what is stored.'}
                              </div>
                            </div>

                          {renderIssues.length > 0 && (
                            <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                              <p className="text-sm font-semibold text-amber-100">Render feedback</p>
                              <ul className="mt-3 space-y-2 text-sm text-amber-50/90">
                                {renderIssues.map((issue, index) => (
                                  <li key={`${issue.type}-${issue.message}-${index}`} className="rounded-2xl bg-black/10 px-3 py-2">
                                    <span className="font-semibold text-amber-100">{issue.type}</span>
                                    {' '}
                                    {issue.message}
                                    {formatIssueLocation(issue) && (
                                      <span className="ml-2 text-xs text-amber-200/80">
                                        {formatIssueLocation(issue)}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Request metadata
                        </p>
                        <dl className="mt-4 space-y-3 text-sm text-slate-300">
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-400">Signed in user</dt>
                            <dd className="font-medium text-white">{currentUser.email}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-400">Tenant header</dt>
                            <dd className="font-medium text-white">{tenantId}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-400">Template id</dt>
                            <dd className="font-medium text-white">{selectedTemplate.id}</dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-400">Updated</dt>
                            <dd className="font-medium text-white">
                              {formatTimestamp(selectedTemplate.updatedAtUtc)}
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <dt className="text-slate-400">Published revision</dt>
                            <dd className="font-medium text-white">
                              {selectedTemplate.publishedRevisionId ?? 'Not published'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Revision history
                        </p>
                        <div className="mt-4 space-y-3">
                          {hasUnsavedChanges && (
                            <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                              Save or publish the current draft before rolling back to a stored revision.
                            </p>
                          )}
                          {isRevisionsLoading ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((value) => (
                                <div
                                  key={value}
                                  className="h-24 animate-pulse rounded-2xl border border-white/10 bg-slate-950/50"
                                />
                              ))}
                            </div>
                          ) : revisions.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                              No revisions available yet.
                            </p>
                          ) : (
                            revisions.map((revision) => (
                              <div
                                key={revision.id}
                                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-semibold text-white">
                                        Revision {revision.revisionNumber}
                                      </span>
                                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                                        {revision.eventType}
                                      </span>
                                      {revision.isPublishedRevision && (
                                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                                          Live
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-300">{revision.subject}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {formatTimestamp(revision.createdAtUtc)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => void handleRollbackTemplate(revision.id)}
                                    disabled={hasUnsavedChanges || isSaving || isPublishing || isRollingBackRevisionId === revision.id}
                                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                                  >
                                    {isRollingBackRevisionId === revision.id ? 'Rolling back…' : 'Rollback'}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-12 text-center">
                    <p className="text-base font-medium text-white">
                      {isTemplateLoading ? 'Loading template…' : 'No template selected'}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Pick a template from the list or create a new one for the active tenant.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
        {previewModal}
      </div>
    </div>
  )
}

type InfoCardProps = {
  title: string
  body: string
}

function InfoCard({ title, body }: InfoCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number
  accent: 'sky' | 'amber' | 'emerald' | 'slate'
}

function MetricCard({ label, value, accent }: MetricCardProps) {
  const accents: Record<MetricCardProps['accent'], string> = {
    sky: 'from-sky-500/20 to-sky-500/5 text-sky-200',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-200',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-200',
    slate: 'from-slate-500/20 to-slate-500/5 text-slate-200',
  }

  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accents[accent]} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function StatusPill({ status }: { status: TemplateStatus }) {
  const tone = {
    Draft: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    Published: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    Archived: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
  }[status]

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  )
}

function TenantSkeleton() {
  return (
    <>
      {[1, 2, 3].map((value) => (
        <div
          key={value}
          className="h-18 animate-pulse rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
        />
      ))}
    </>
  )
}

function TemplateListSkeleton() {
  return (
    <>
      {[1, 2, 3].map((value) => (
        <div
          key={value}
          className="h-32 animate-pulse rounded-3xl border border-white/10 bg-slate-900/45"
        />
      ))}
    </>
  )
}

function EditorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-14 animate-pulse rounded-2xl bg-slate-900/60" />
        <div className="h-14 animate-pulse rounded-2xl bg-slate-900/60" />
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-slate-900/60" />
      <div className="h-80 animate-pulse rounded-3xl bg-slate-900/60" />
    </div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-4 bg-slate-100 p-6">
      <div className="h-6 w-40 animate-pulse rounded-full bg-slate-300" />
      <div className="h-5 w-64 animate-pulse rounded-full bg-slate-200" />
      <div className="h-56 animate-pulse rounded-3xl bg-white" />
    </div>
  )
}

type PreviewModalProps = {
  renderedHtml: string
  templateName: string
  renderIssues: MjmlRenderIssueDto[]
  isPreviewStale: boolean
  previewViewport: PreviewViewport
  onClose: () => void
  onOpenInBrowser: () => void
  onSelectViewport: (viewport: PreviewViewport) => void
}

function PreviewModal({
  renderedHtml,
  templateName,
  renderIssues,
  isPreviewStale,
  previewViewport,
  onClose,
  onOpenInBrowser,
  onSelectViewport,
}: PreviewModalProps) {
  const activeViewport = previewViewportOptions.find((option) => option.id === previewViewport) ?? previewViewportOptions[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Expanded preview
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">{templateName}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Inspect the rendered email in a roomier viewport, or open it in a separate browser window.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPreviewStale && (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                Preview out of date
              </span>
            )}
            <button
              type="button"
              onClick={onOpenInBrowser}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Open in browser
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>

        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {previewViewportOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectViewport(option.id)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  previewViewport === option.id
                    ? 'border-sky-400/50 bg-sky-500/10 text-sky-100'
                    : 'border-white/10 bg-slate-950/60 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                }`}
              >
                {option.label}
                <span className="ml-2 text-xs text-slate-400">{option.width}px</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-400">{activeViewport.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950/60 p-6">
          <div
            className="mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/25"
            style={{ width: `${activeViewport.width}px`, maxWidth: '100%' }}
          >
            <iframe
              title="Expanded MJML HTML preview"
              srcDoc={renderedHtml}
              sandbox=""
              className="min-h-[720px] w-full bg-white"
            />
          </div>

          <div className="mx-auto mt-4 max-w-5xl rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">{renderIssues.length}</span>
            {' '}
            render issue{renderIssues.length === 1 ? '' : 's'}
            <span className="ml-2 text-slate-400">
              The email itself still targets the standard 600px MJML body inside the selected viewport.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

type BuilderSidebarProps = {
  draft: TemplateDraft
  selectedTemplate: TemplateDto
  activeBuilderTab: BuilderSidebarTab
  setActiveBuilderTab: (tab: BuilderSidebarTab) => void
  selectedSection: EditorSection | null
  selectedColumn: EditorColumn | null
  selectedBlock: EditorBlock | null
  selectedSectionId: string | null
  selectedColumnId: string | null
  updateDraft: (field: keyof TemplateDraft, value: string) => void
  handleAddBlock: (type: EditorBlockType) => void
  handleAddSection: (columnCount: number) => void
  handleAddPresetSection: (preset: BuilderPreset) => void
  handleUpdateSection: (changes: Partial<EditorSection>) => void
  handleUpdateSelectedColumnWidth: (width: number | null) => void
  handleUpdateSelectedBlock: (changes: Partial<EditorBlock>) => void
  handleSelectSection: (sectionId: string) => void
  handleSelectColumn: (sectionId: string, columnId: string) => void
  handleStartBuilder: (preset?: BuilderPreset) => void
}

function BuilderSidebar({
  draft,
  selectedTemplate,
  activeBuilderTab,
  setActiveBuilderTab,
  selectedSection,
  selectedColumn,
  selectedBlock,
  selectedSectionId,
  selectedColumnId,
  updateDraft,
  handleAddBlock,
  handleAddSection,
  handleAddPresetSection,
  handleUpdateSection,
  handleUpdateSelectedColumnWidth,
  handleUpdateSelectedBlock,
  handleSelectSection,
  handleSelectColumn,
  handleStartBuilder,
}: BuilderSidebarProps) {
  const hasBuilderDocument = draft.editorDocument !== null

  return (
    <aside className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-5 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={selectedTemplate.status} />
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
            Revision {selectedTemplate.currentRevisionNumber}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Template name
            </span>
            <input
              type="text"
              value={draft.name}
              onChange={(event) => updateDraft('name', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Subject line
            </span>
            <input
              type="text"
              value={draft.subject}
              onChange={(event) => updateDraft('subject', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Status
            </span>
            <select
              value={draft.status === 'Published' ? 'Draft' : draft.status}
              onChange={(event) => updateDraft('status', event.target.value as TemplateStatus)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
            >
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-900/50 p-5 shadow-2xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Builder tools
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
              <div className="grid gap-2">
                {builderBlockPalette.map((block) => (
                  <button
                    key={block.type}
                    type="button"
                    onClick={() => handleAddBlock(block.type)}
                    disabled={!hasBuilderDocument}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left transition hover:border-white/20 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block text-sm font-semibold text-white">{block.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{block.description}</span>
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
                    {(selectedBlock.type === 'Hero' || selectedBlock.type === 'Text') && (
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

                    {selectedBlock.type === 'Image' && (
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
                      </>
                    )}

                    {selectedBlock.type === 'Button' && (
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
                  </div>
                </div>
              )}
            </div>
          )}

          {activeBuilderTab === 'sections' && (
            <div className="space-y-4">
              <div className="grid gap-2">
                {builderSectionOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAddSection(option.columns)}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left transition hover:border-white/20 hover:bg-slate-900"
                  >
                    <span className="block text-sm font-semibold text-white">{option.label}</span>
                    <span className="mt-1 block text-xs text-slate-400">{option.description}</span>
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
            <div className="space-y-3">
              {builderPresetOptions.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddPresetSection(preset.id)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left transition hover:border-white/20 hover:bg-slate-900"
                >
                  <span className="block text-sm font-semibold text-white">{preset.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{preset.description}</span>
                </button>
              ))}

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

                        {selectedBlock.type === 'Image' && (
                          <label className="block">
                            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Alignment
                            </span>
                            <select
                              value={selectedBlock.alignment ?? 'Center'}
                              onChange={(event) => handleUpdateSelectedBlock({ alignment: event.target.value as EditorAlignment })}
                              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                            >
                              <option value="Left">Left</option>
                              <option value="Center">Center</option>
                              <option value="Right">Right</option>
                            </select>
                          </label>
                        )}

                        {(selectedBlock.type === 'Hero' || selectedBlock.type === 'Text') && (
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
                                Button background
                              </span>
                              <input
                                type="text"
                                value={selectedBlock.backgroundColor ?? ''}
                                onChange={(event) => handleUpdateSelectedBlock({ backgroundColor: event.target.value })}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
                              />
                            </label>
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
                          </>
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
}

function BuilderCanvas({
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
            Select sections and blocks on the canvas, drag them to reorder, then use the left sidebar to add content, layouts, presets, and styles.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {draft.editorDocument.sections.length} section{draft.editorDocument.sections.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-6 min-h-[720px] rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
        <div className="mx-auto max-w-[760px] space-y-5">
          {draft.editorDocument.sections.map((section, sectionIndex) => {
            const isSectionSelected = section.id === selectedSectionId

            return (
              <div
                key={section.id}
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
                  sectionDropTargetId === section.id && draggedSectionId !== section.id
                    ? 'border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/10'
                    : isSectionSelected
                      ? 'border-sky-400/60 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                      : 'border-white/10 bg-white hover:border-white/20'
                } ${draggedSectionId === section.id ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Section {sectionIndex + 1}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {section.columns.length} column{section.columns.length === 1 ? '' : 's'} · padding {section.padding ?? 24}px
                    </p>
                  </div>
                  <div
                    className="h-5 w-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: section.backgroundColor ?? '#ffffff' }}
                  />
                </div>

                <div
                  className="mt-5 grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr))` }}
                >
                  {section.columns.map((column) => (
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
                        blockDropTargetId === null && columnDropTargetId === column.id && draggedBlock
                          ? 'border-amber-400/60 bg-amber-50 shadow-sm shadow-amber-200/70'
                          : selectedColumnId === column.id
                            ? 'border-sky-400/60 bg-sky-50 shadow-sm shadow-sky-200/70'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      {column.blocks.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                          Empty column
                          <span className="mt-2 block text-xs text-slate-400">Select this column, then add a block from the sidebar.</span>
                        </div>
                      ) : (
                        column.blocks.map((block) => (
                          <div
                            key={block.id}
                            draggable
                            onDragStart={(event) => {
                              event.stopPropagation()
                              handleBlockDragStart(section.id, column.id, block.id)
                            }}
                            onDragOver={(event) => {
                              if (!draggedBlock || draggedBlock.blockId === block.id) {
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
                              blockDropTargetId === block.id && draggedBlock?.blockId !== block.id
                                ? 'border-amber-400/60 bg-amber-50 shadow-sm shadow-amber-200/70'
                                : selectedBlockId === block.id
                                  ? 'border-sky-400/60 bg-sky-50 shadow-sm shadow-sky-200/70'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                            } ${draggedBlock?.blockId === block.id ? 'opacity-60' : ''}`}
                          >
                            <CanvasBlockPreview block={block} />
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CanvasBlockPreview({ block }: { block: EditorBlock }) {
  if (block.type === 'Hero') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Heading</p>
        <p
          className="mt-2 font-semibold"
          style={{ color: block.textColor ?? '#1f2937', fontSize: `${block.fontSize ?? 24}px`, textAlign: (block.alignment ?? 'Left').toLowerCase() as 'left' | 'center' | 'right' }}
        >
          {block.textContent}
        </p>
      </div>
    )
  }

  if (block.type === 'Text') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Paragraph</p>
        <p
          className="mt-2 leading-6"
          style={{ color: block.textColor ?? '#475569', fontSize: `${block.fontSize ?? 16}px`, textAlign: (block.alignment ?? 'Left').toLowerCase() as 'left' | 'center' | 'right' }}
        >
          {block.textContent}
        </p>
      </div>
    )
  }

  if (block.type === 'Image') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Image</p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {block.imageUrl ? (
            <img src={block.imageUrl} alt={block.altText ?? 'Campaign visual'} className="h-36 w-full object-cover" />
          ) : (
            <div className="flex h-36 items-center justify-center text-sm text-slate-500">No image URL</div>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'Button') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Button</p>
        <div className="mt-3">
          <span
            className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: block.backgroundColor ?? '#2563eb',
              color: block.textColor ?? '#ffffff',
            }}
          >
            {block.actionLabel || 'Button'}
          </span>
        </div>
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

function toSummary(template: TemplateDto): TemplateSummaryDto {
  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    status: template.status,
    updatedAtUtc: template.updatedAtUtc,
  }
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatIssueLocation(issue: MjmlRenderIssueDto) {
  if (!issue.lineNumber) {
    return null
  }

  return issue.linePosition
    ? `Line ${issue.lineNumber}, column ${issue.linePosition}`
    : `Line ${issue.lineNumber}`
}

export default App
