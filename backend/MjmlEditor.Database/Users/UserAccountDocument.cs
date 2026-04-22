using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.Users;

public sealed class UserAccountDocument
{
    [BsonId]
    public string Id { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string NormalizedEmail { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string PasswordHash { get; init; } = string.Empty;

    public IReadOnlyList<TenantMembershipDocument> Memberships { get; init; } = [];

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime CreatedAtUtc { get; init; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime UpdatedAtUtc { get; init; }
}
