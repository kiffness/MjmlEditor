using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateRevisionDocument
{
    public string Id { get; init; } = string.Empty;

    public int RevisionNumber { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Subject { get; init; } = string.Empty;

    public string MjmlBody { get; init; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public string Status { get; init; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public string EventType { get; init; } = string.Empty;

    public string ActorUserId { get; init; } = string.Empty;

    public EmailTemplateEditorDocument? EditorDocument { get; init; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAtUtc { get; init; }
}
