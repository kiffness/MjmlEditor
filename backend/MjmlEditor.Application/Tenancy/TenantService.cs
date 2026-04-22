using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Contracts.Tenancy;

namespace MjmlEditor.Application.Tenancy;

internal sealed class TenantService(
    ITenantRepository tenantRepository,
    IUserAccountRepository userAccountRepository,
    ICurrentUserAccessor currentUserAccessor) : ITenantService
{
    public async Task<IReadOnlyList<TenantDto>> ListAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserAccessor.GetRequiredUserId();
        var userAccount = await userAccountRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("The authenticated user could not be found.");
        var tenantIds = userAccount.GetTenantIds();
        var tenants = tenantIds.Count == 0
            ? []
            : await tenantRepository.ListByIdsAsync(tenantIds, cancellationToken);

        return tenants
            .Select(tenant => tenant.ToDto())
            .ToArray();
    }
}
