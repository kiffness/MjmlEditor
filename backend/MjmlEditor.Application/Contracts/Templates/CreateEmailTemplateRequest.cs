namespace MjmlEditor.Application.Contracts.Templates;

public sealed record CreateEmailTemplateRequest(
    string Name,
    string Subject,
    string MjmlBody,
    EmailTemplateEditorDocumentDto? EditorDocument = null);
