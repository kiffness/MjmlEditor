namespace MjmlEditor.Domain.Users;

public sealed record TenantMembership(string TenantId, TenantMembershipRole Role)
{
    public string TenantId { get; } = NormalizeTenantId(TenantId);

    public TenantMembershipRole Role { get; } = ValidateRole(Role);

    private static string NormalizeTenantId(string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        }

        return tenantId.Trim();
    }

    private static TenantMembershipRole ValidateRole(TenantMembershipRole role)
    {
        if (!Enum.IsDefined(role))
        {
            throw new ArgumentOutOfRangeException(nameof(role), role, "Unsupported tenant membership role.");
        }

        return role;
    }
}
