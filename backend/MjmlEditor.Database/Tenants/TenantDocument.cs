using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.Tenants;

public sealed class TenantDocument
{
    [BsonId]
    public string Id { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAtUtc { get; init; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAtUtc { get; init; }
}
