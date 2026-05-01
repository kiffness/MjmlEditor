import { describe, expect, it } from 'vitest'

import type { TemplateDto } from '../../lib/api'
import { createDefaultBlock, createSection, type TemplateDraft } from './builderModel'
import { getTemplateDraftStateSignature, hasPersistedDraftChanges } from './draftState'

function createTemplate(): TemplateDto {
  return {
    id: 'template-1',
    name: 'Fantastic Plastic Campaign #7',
    subject: 'Offers for buyers',
    status: 'Draft',
    createdAtUtc: '2026-05-01T00:00:00Z',
    updatedAtUtc: '2026-05-01T00:00:00Z',
    currentRevisionNumber: 1,
    publishedRevisionId: null,
    mjmlBody: '<mjml></mjml>',
    editorDocument: {
      version: 1,
      sections: [
        createSection(1, [[
          createDefaultBlock('Hero'),
          createDefaultBlock('Text'),
          createDefaultBlock('Button'),
        ]]),
      ],
    },
  }
}

function createDraftFromTemplate(template: TemplateDto): TemplateDraft {
  return {
    name: template.name,
    subject: template.subject,
    status: template.status,
    mjmlBody: template.mjmlBody,
    editorDocument: template.editorDocument
      ? JSON.parse(JSON.stringify(template.editorDocument)) as TemplateDraft['editorDocument']
      : null,
  }
}

describe('draftState', () => {
  it('marks rebuilt builder content as unsaved when it differs from the loaded template', () => {
    const template = createTemplate()
    const draft = createDraftFromTemplate(template)
    const savedSignature = getTemplateDraftStateSignature(template)

    draft.editorDocument = {
      version: 1,
      sections: [
        createSection(1, [[
          createDefaultBlock('Hero'),
          createDefaultBlock('Divider'),
          createDefaultBlock('Text'),
        ]]),
      ],
    }

    expect(hasPersistedDraftChanges(savedSignature, draft)).toBe(true)
  })

  it('does not mark an unchanged draft as unsaved', () => {
    const template = createTemplate()
    const draft = createDraftFromTemplate(template)

    expect(hasPersistedDraftChanges(getTemplateDraftStateSignature(template), draft)).toBe(false)
  })
})
