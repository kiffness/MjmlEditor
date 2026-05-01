namespace MjmlEditor.Domain.BrandLibrary;

public interface IBrandLibraryRepository
{
    Task<BrandLibrary?> GetByTenantIdAsync(string tenantId, CancellationToken cancellationToken);
    Task UpsertAsync(BrandLibrary brandLibrary, CancellationToken cancellationToken);
}
