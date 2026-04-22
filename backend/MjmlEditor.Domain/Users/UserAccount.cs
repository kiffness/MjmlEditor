namespace MjmlEditor.Domain.Users;

public sealed class UserAccount
{
    public string Id { get; private set; }

    public string Email { get; private set; }

    public string NormalizedEmail { get; private set; }

    public string DisplayName { get; private set; }

    public string PasswordHash { get; private set; }

    public IReadOnlyList<TenantMembership> Memberships { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static UserAccount Create(
        string id,
        string email,
        string displayName,
        string passwordHash,
        IReadOnlyList<TenantMembership> memberships,
        DateTimeOffset createdAtUtc)
    {
        return new UserAccount(
            NormalizeRequired(id, nameof(id)),
            NormalizeEmail(email),
            NormalizeRequired(displayName, nameof(displayName)),
            NormalizeRequired(passwordHash, nameof(passwordHash)),
            NormalizeMemberships(memberships),
            NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc)),
            NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc)));
    }

    public static UserAccount Restore(
        string id,
        string email,
        string displayName,
        string passwordHash,
        IReadOnlyList<TenantMembership> memberships,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc)
    {
        var normalizedCreatedAt = NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc));
        var normalizedUpdatedAt = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));

        if (normalizedUpdatedAt < normalizedCreatedAt)
        {
            throw new ArgumentException("UpdatedAtUtc cannot be earlier than CreatedAtUtc.", nameof(updatedAtUtc));
        }

        return new UserAccount(
            NormalizeRequired(id, nameof(id)),
            NormalizeEmail(email),
            NormalizeRequired(displayName, nameof(displayName)),
            NormalizeRequired(passwordHash, nameof(passwordHash)),
            NormalizeMemberships(memberships),
            normalizedCreatedAt,
            normalizedUpdatedAt);
    }

    public bool HasTenantAccess(string tenantId)
    {
        var normalizedTenantId = NormalizeRequired(tenantId, nameof(tenantId));
        return Memberships.Any(membership => string.Equals(
            membership.TenantId,
            normalizedTenantId,
            StringComparison.Ordinal));
    }

    public IReadOnlyList<string> GetTenantIds()
    {
        return Memberships
            .Select(membership => membership.TenantId)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
    }

    private UserAccount(
        string id,
        string email,
        string displayName,
        string passwordHash,
        IReadOnlyList<TenantMembership> memberships,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc)
    {
        Id = id;
        Email = email;
        NormalizedEmail = email.ToUpperInvariant();
        DisplayName = displayName;
        PasswordHash = passwordHash;
        Memberships = memberships;
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

    private static string NormalizeEmail(string email)
    {
        var normalizedEmail = NormalizeRequired(email, nameof(email));

        if (!normalizedEmail.Contains('@', StringComparison.Ordinal))
        {
            throw new ArgumentException("A valid email is required.", nameof(email));
        }

        return normalizedEmail;
    }

    private static IReadOnlyList<TenantMembership> NormalizeMemberships(IReadOnlyList<TenantMembership> memberships)
    {
        ArgumentNullException.ThrowIfNull(memberships);

        if (memberships.Count == 0)
        {
            throw new ArgumentException("At least one tenant membership is required.", nameof(memberships));
        }

        return memberships
            .GroupBy(membership => membership.TenantId, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToArray();
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
