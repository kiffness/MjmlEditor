namespace MjmlEditor.Domain.Params;

/// <summary>
/// The complete set of template param definitions for a single tenant.
/// Each definition declares a key (e.g. <c>bedrooms</c>) that template authors
/// reference as <c>{{ params.bedrooms }}</c> in block content.
/// </summary>
public sealed class TenantParams
{
    public string TenantId { get; private init; } = string.Empty;

    public IReadOnlyList<ParamDefinition> Params { get; private init; } = [];

    public DateTimeOffset CreatedAtUtc { get; private init; }

    public DateTimeOffset UpdatedAtUtc { get; private init; }

    /// <summary>Creates a new tenant params record.</summary>
    public static TenantParams Create(string tenantId, IReadOnlyList<ParamDefinition> paramDefinitions, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new ArgumentException("TenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(paramDefinitions);

        return new TenantParams
        {
            TenantId = tenantId.Trim(),
            Params = paramDefinitions,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
    }

    /// <summary>Restores tenant params from persistence without re-validating.</summary>
    public static TenantParams Restore(
        string tenantId,
        IReadOnlyList<ParamDefinition> paramDefinitions,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc)
    {
        return new TenantParams
        {
            TenantId = tenantId,
            Params = paramDefinitions,
            CreatedAtUtc = createdAtUtc,
            UpdatedAtUtc = updatedAtUtc
        };
    }

    /// <summary>Returns a new instance with a fully replaced set of param definitions.</summary>
    public TenantParams Update(IReadOnlyList<ParamDefinition> paramDefinitions, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(paramDefinitions);

        return new TenantParams
        {
            TenantId = TenantId,
            Params = paramDefinitions,
            CreatedAtUtc = CreatedAtUtc,
            UpdatedAtUtc = now
        };
    }
}
