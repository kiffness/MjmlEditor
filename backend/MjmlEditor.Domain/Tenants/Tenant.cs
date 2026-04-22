namespace MjmlEditor.Domain.Tenants;

public sealed class Tenant
{
    public string Id { get; private set; }

    public string Name { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static Tenant Create(string id, string name, DateTimeOffset createdAtUtc)
    {
        var normalizedCreatedAt = NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc));

        return new Tenant(
            NormalizeRequired(id, nameof(id)),
            NormalizeRequired(name, nameof(name)),
            normalizedCreatedAt,
            normalizedCreatedAt);
    }

    public static Tenant Restore(string id, string name, DateTimeOffset createdAtUtc, DateTimeOffset updatedAtUtc)
    {
        var normalizedCreatedAt = NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc));
        var normalizedUpdatedAt = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));

        if (normalizedUpdatedAt < normalizedCreatedAt)
        {
            throw new ArgumentException("UpdatedAtUtc cannot be earlier than CreatedAtUtc.", nameof(updatedAtUtc));
        }

        return new Tenant(
            NormalizeRequired(id, nameof(id)),
            NormalizeRequired(name, nameof(name)),
            normalizedCreatedAt,
            normalizedUpdatedAt);
    }

    private Tenant(string id, string name, DateTimeOffset createdAtUtc, DateTimeOffset updatedAtUtc)
    {
        Id = id;
        Name = name;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = updatedAtUtc;
    }

    private static string NormalizeRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", paramName);
        }

        return value.Trim();
    }

    private static DateTimeOffset NormalizeTimestamp(DateTimeOffset value, string paramName)
    {
        if (value == default)
        {
            throw new ArgumentException("A valid timestamp is required.", paramName);
        }

        return value.ToUniversalTime();
    }
}
