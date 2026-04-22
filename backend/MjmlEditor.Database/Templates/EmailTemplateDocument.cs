using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateDocument
{
    [BsonId]
    public string Id { get; init; } = string.Empty;

    public string TenantId { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public string Subject { get; init; } = string.Empty;

    public string MjmlBody { get; init; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public string Status { get; init; } = string.Empty;

    public EmailTemplateEditorDocument? EditorDocument { get; init; }

    public string? PublishedRevisionId { get; init; }

    public IReadOnlyList<EmailTemplateRevisionDocument> Revisions { get; init; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAtUtc { get; init; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAtUtc { get; init; }
}
