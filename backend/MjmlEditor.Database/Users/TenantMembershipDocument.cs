namespace MjmlEditor.Database.Users;

public sealed class TenantMembershipDocument
{
    public string TenantId { get; init; } = string.Empty;

    public string Role { get; init; } = string.Empty;
}
