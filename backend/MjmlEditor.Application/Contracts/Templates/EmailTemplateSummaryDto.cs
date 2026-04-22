using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateSummaryDto(
    string Id,
    string Name,
    string Subject,
    EmailTemplateStatus Status,
    DateTimeOffset UpdatedAtUtc);
