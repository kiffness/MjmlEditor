using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record UpdateEmailTemplateRequest(
    string Name,
    string Subject,
    string MjmlBody,
    EmailTemplateStatus Status,
    EmailTemplateEditorDocumentDto? EditorDocument = null);
