using MjmlEditor.Application.Contracts.Auth;
using MjmlEditor.Domain.Users;

namespace MjmlEditor.Application.Auth;

internal static class AuthMappings
{
    public static AuthenticatedUserDto ToDto(this UserAccount userAccount)
    {
        return new AuthenticatedUserDto(
            userAccount.Id,
            userAccount.Email,
            userAccount.DisplayName,
            userAccount.Memberships
                .Select(membership => new AuthenticatedTenantMembershipDto(
                    membership.TenantId,
                    membership.Role.ToString()))
                .ToArray());
    }
}
