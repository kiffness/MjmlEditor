using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateDto(
    string Id,
    string Name,
    string Subject,
    string MjmlBody,
    EmailTemplateStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    int CurrentRevisionNumber,
    string? PublishedRevisionId,
    EmailTemplateEditorDocumentDto? EditorDocument);
