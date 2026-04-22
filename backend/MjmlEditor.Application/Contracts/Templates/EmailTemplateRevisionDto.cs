using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateRevisionDto(
    string Id,
    int RevisionNumber,
    string Name,
    string Subject,
    EmailTemplateStatus Status,
    EmailTemplateRevisionEvent EventType,
    string ActorUserId,
    DateTimeOffset CreatedAtUtc,
    bool IsPublishedRevision);
