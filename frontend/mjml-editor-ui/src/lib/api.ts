export type TemplateStatus = 'Draft' | 'Published' | 'Archived'

export type TenantDto = {
  id: string
  name: string
  createdAtUtc: string
  updatedAtUtc: string
}

export type AuthenticatedTenantMembershipDto = {
  tenantId: string
  role: string
}

export type AuthenticatedUserDto = {
  id: string
  email: string
  displayName: string
  memberships: AuthenticatedTenantMembershipDto[]
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  expiresAtUtc: string
  user: AuthenticatedUserDto
}

export type TemplateSummaryDto = {
  id: string
  name: string
  subject: string
  status: TemplateStatus
  updatedAtUtc: string
}

export type EditorAlignment = 'Left' | 'Center' | 'Right'

export type EditorBlockType = 'Hero' | 'Text' | 'Image' | 'Button' | 'Spacer' | 'Divider'

export type EditorBlock = {
  id: string
  type: EditorBlockType
  textContent?: string | null
  imageUrl?: string | null
  altText?: string | null
  actionLabel?: string | null
  actionUrl?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  alignment?: EditorAlignment | null
  fontSize?: number | null
  spacing?: number | null
  dividerColor?: string | null
  dividerThickness?: number | null
}

export type EditorColumn = {
  id: string
  widthPercentage: number
  blocks: EditorBlock[]
}

export type EditorSection = {
  id: string
  backgroundColor?: string | null
  padding?: number | null
  columns: EditorColumn[]
}

export type EditorDocument = {
  version: number
  sections: EditorSection[]
}

export type TemplateDto = TemplateSummaryDto & {
  mjmlBody: string
  createdAtUtc: string
  currentRevisionNumber: number
  publishedRevisionId: string | null
  editorDocument?: EditorDocument | null
}

export type TemplateRevisionEvent =
  | 'Created'
  | 'DraftSaved'
  | 'Published'
  | 'RolledBack'
  | 'Archived'

export type TemplateRevisionDto = {
  id: string
  revisionNumber: number
  name: string
  subject: string
  status: TemplateStatus
  eventType: TemplateRevisionEvent
  actorUserId: string
  createdAtUtc: string
  isPublishedRevision: boolean
}

export type CreateTemplateRequest = {
  name: string
  subject: string
  mjmlBody: string
  editorDocument?: EditorDocument | null
}

export type MjmlRenderIssueDto = {
  message: string
  type: string
  lineNumber: number | null
  linePosition: number | null
}

export type RenderMjmlResponse = {
  html: string
  issues: MjmlRenderIssueDto[]
}

export type RenderMjmlRequest = {
  mjmlBody: string
  editorDocument?: EditorDocument | null
}

export type UpdateTemplateRequest = CreateTemplateRequest & {
  status: TemplateStatus
}

type ProblemDetails = {
  title?: string
  detail?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5261'
const authTokenStorageKey = 'mjml-editor-auth-token'

async function request<T>(path: string, init?: RequestInit, tenantId?: string): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  const authToken = getStoredAuthToken()

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  if (tenantId) {
    headers.set('X-Tenant', tenantId)
  }

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`

    try {
      const problem = (await response.json()) as ProblemDetails
      message = problem.detail ?? problem.title ?? message
    } catch {
      // Ignore malformed error payloads and keep the fallback message.
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function getApiBaseUrl() {
  return apiBaseUrl
}

export function getStoredAuthToken() {
  return window.localStorage.getItem(authTokenStorageKey)
}

export function storeAuthToken(accessToken: string) {
  window.localStorage.setItem(authTokenStorageKey, accessToken)
}

export function clearStoredAuthToken() {
  window.localStorage.removeItem(authTokenStorageKey)
}

export async function login(payload: LoginRequest) {
  const response = await request<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    })

  storeAuthToken(response.accessToken)
  return response
}

export function getCurrentUser() {
  return request<AuthenticatedUserDto>('/api/auth/me')
}

export function listTenants() {
  return request<TenantDto[]>('/api/tenants')
}

export function listTemplates(tenantId: string) {
  return request<TemplateSummaryDto[]>('/api/templates', undefined, tenantId)
}

export function getTemplate(tenantId: string, templateId: string) {
  return request<TemplateDto>(`/api/templates/${templateId}`, undefined, tenantId)
}

export function createTemplate(tenantId: string, payload: CreateTemplateRequest) {
  return request<TemplateDto>(
    '/api/templates',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    tenantId
  )
}

export function renderMjml(tenantId: string, payload: RenderMjmlRequest) {
  return request<RenderMjmlResponse>(
    '/api/templates/render',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    tenantId
  )
}

export function renderStoredTemplate(tenantId: string, templateId: string) {
  return request<RenderMjmlResponse>(`/api/templates/${templateId}/render`, undefined, tenantId)
}

export function listTemplateRevisions(tenantId: string, templateId: string) {
  return request<TemplateRevisionDto[]>(`/api/templates/${templateId}/revisions`, undefined, tenantId)
}

export function publishTemplate(tenantId: string, templateId: string) {
  return request<TemplateDto>(
    `/api/templates/${templateId}/publish`,
    {
      method: 'POST',
    },
    tenantId
  )
}

export function rollbackTemplate(tenantId: string, templateId: string, revisionId: string) {
  return request<TemplateDto>(
    `/api/templates/${templateId}/rollback`,
    {
      method: 'POST',
      body: JSON.stringify({ revisionId }),
    },
    tenantId
  )
}

export function updateTemplate(tenantId: string, templateId: string, payload: UpdateTemplateRequest) {
  return request<TemplateDto>(
    `/api/templates/${templateId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    tenantId
  )
}

export function deleteTemplate(tenantId: string, templateId: string) {
  return request<void>(
    `/api/templates/${templateId}`,
    {
      method: 'DELETE',
    },
    tenantId
  )
}
