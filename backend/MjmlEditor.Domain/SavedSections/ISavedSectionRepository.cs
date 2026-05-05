namespace MjmlEditor.Domain.SavedSections;

public interface ISavedSectionRepository
{
    Task<SavedSection?> GetByIdAsync(string tenantId, string id, CancellationToken cancellationToken);

    Task<IReadOnlyList<SavedSection>> ListByTenantIdAsync(string tenantId, CancellationToken cancellationToken);

    Task AddAsync(SavedSection savedSection, CancellationToken cancellationToken);

    Task UpdateAsync(SavedSection savedSection, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(string tenantId, string id, CancellationToken cancellationToken);
}
