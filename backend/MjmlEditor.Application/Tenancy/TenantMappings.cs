using MjmlEditor.Application.Contracts.Tenancy;
using MjmlEditor.Domain.Tenants;

namespace MjmlEditor.Application.Tenancy;

public static class TenantMappings
{
    public static TenantDto ToDto(this Tenant tenant)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        return new TenantDto(
            tenant.Id,
            tenant.Name,
            tenant.CreatedAtUtc,
            tenant.UpdatedAtUtc);
    }
}
