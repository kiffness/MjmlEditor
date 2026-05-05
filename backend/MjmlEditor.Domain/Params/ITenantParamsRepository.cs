namespace MjmlEditor.Domain.Params;

/// <summary>Persistence contract for tenant template param definitions.</summary>
public interface ITenantParamsRepository
{
    /// <summary>Returns the param definitions for the given tenant, or <c>null</c> if none have been set.</summary>
    Task<TenantParams?> GetByTenantIdAsync(string tenantId, CancellationToken cancellationToken);

    /// <summary>Inserts or replaces the param definitions for a tenant.</summary>
    Task UpsertAsync(TenantParams tenantParams, CancellationToken cancellationToken);
}
