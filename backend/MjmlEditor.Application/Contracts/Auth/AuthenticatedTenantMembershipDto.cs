namespace MjmlEditor.Application.Contracts.Auth;

public sealed record AuthenticatedTenantMembershipDto(
    string TenantId,
    string Role);
