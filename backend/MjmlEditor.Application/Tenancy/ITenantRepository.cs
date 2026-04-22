namespace MjmlEditor.Application.Tenancy;

public interface ITenantRepository
{
    Task<IReadOnlyList<Domain.Tenants.Tenant>> ListAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<Domain.Tenants.Tenant>> ListByIdsAsync(IReadOnlyCollection<string> tenantIds, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string tenantId, CancellationToken cancellationToken);
}
