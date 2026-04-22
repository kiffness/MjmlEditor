namespace MjmlEditor.Application.Contracts.Auth;

public sealed record AuthenticatedUserDto(
    string Id,
    string Email,
    string DisplayName,
    IReadOnlyList<AuthenticatedTenantMembershipDto> Memberships);
