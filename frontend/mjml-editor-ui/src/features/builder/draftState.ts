import type { TemplateDto } from '../../lib/api'
import { cloneEditorDocument, type TemplateDraft } from './builderModel'

export function cloneDraftState(draft: TemplateDraft): TemplateDraft {
  return {
    ...draft,
    editorDocument: cloneEditorDocument(draft.editorDocument),
  }
}

export function getDraftStateSignature(draft: TemplateDraft) {
  return JSON.stringify({
    name: draft.name,
    subject: draft.subject,
    status: draft.status,
    mjmlBody: draft.mjmlBody,
    editorDocument: draft.editorDocument,
  })
}

export function getTemplateDraftStateSignature(template: TemplateDto) {
  return getDraftStateSignature({
    name: template.name,
    subject: template.subject,
    status: template.status,
    mjmlBody: template.mjmlBody,
    editorDocument: cloneEditorDocument(template.editorDocument ?? null),
  })
}

export function hasPersistedDraftChanges(savedDraftStateSignature: string | null, draft: TemplateDraft | null) {
  return draft !== null
    && savedDraftStateSignature !== null
    && getDraftStateSignature(draft) !== savedDraftStateSignature
}
