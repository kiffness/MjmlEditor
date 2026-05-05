using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.Params;

public sealed class TenantParamsDocument
{
    /// <summary>Document id is the tenant id — one document per tenant.</summary>
    [BsonId]
    public string Id { get; init; } = string.Empty;

    public string TenantId { get; init; } = string.Empty;

    public ParamDefinitionDocument[] Params { get; init; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAtUtc { get; init; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAtUtc { get; init; }
}
