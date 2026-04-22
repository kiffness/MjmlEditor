using MjmlEditor.Application.Tenancy;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Domain.Tenants;
using MongoDB.Driver;

namespace MjmlEditor.Database.Tenants;

internal sealed class MongoTenantRepository : ITenantRepository
{
    private readonly IMongoCollection<TenantDocument> collection;

    public MongoTenantRepository(IMongoDatabase database, MongoDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(options);

        collection = database.GetCollection<TenantDocument>(options.TenantsCollectionName);
    }

    public async Task<IReadOnlyList<Tenant>> ListAsync(CancellationToken cancellationToken)
    {
        var documents = await collection
            .Find(FilterDefinition<TenantDocument>.Empty)
            .SortBy(document => document.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(ToDomain).ToArray();
    }

    public async Task<IReadOnlyList<Tenant>> ListByIdsAsync(IReadOnlyCollection<string> tenantIds, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenantIds);

        if (tenantIds.Count == 0)
        {
            return [];
        }

        var documents = await collection
            .Find(document => tenantIds.Contains(document.Id))
            .SortBy(document => document.Name)
            .ToListAsync(cancellationToken);

        return documents.Select(ToDomain).ToArray();
    }

    public Task<bool> ExistsAsync(string tenantId, CancellationToken cancellationToken)
    {
        return collection.Find(document => document.Id == tenantId).AnyAsync(cancellationToken);
    }

    private static Tenant ToDomain(TenantDocument document)
    {
        return Tenant.Restore(
            document.Id,
            document.Name,
            DateTime.SpecifyKind(document.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(document.UpdatedAtUtc, DateTimeKind.Utc));
    }
}
