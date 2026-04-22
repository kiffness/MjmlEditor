namespace MjmlEditor.Application.Contracts.Templates;

public sealed record RenderMjmlRequest(
    string MjmlBody,
    EmailTemplateEditorDocumentDto? EditorDocument = null);
