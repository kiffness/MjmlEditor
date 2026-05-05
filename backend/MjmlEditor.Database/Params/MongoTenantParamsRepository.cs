using MjmlEditor.Database.Configuration;
using MjmlEditor.Domain.Params;
using MongoDB.Driver;

namespace MjmlEditor.Database.Params;

internal sealed class MongoTenantParamsRepository(
    IMongoDatabase database,
    MongoDbOptions options) : ITenantParamsRepository
{
    private readonly IMongoCollection<TenantParamsDocument> _collection =
        database.GetCollection<TenantParamsDocument>(options.TenantParamsCollectionName);

    /// <inheritdoc/>
    public async Task<TenantParams?> GetByTenantIdAsync(string tenantId, CancellationToken cancellationToken)
    {
        var doc = await _collection
            .Find(x => x.TenantId == tenantId)
            .FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : MapToDomain(doc);
    }

    /// <inheritdoc/>
    public Task UpsertAsync(TenantParams tenantParams, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenantParams);

        var doc = MapToDocument(tenantParams);

        return _collection.ReplaceOneAsync(
            x => x.TenantId == tenantParams.TenantId,
            doc,
            new ReplaceOptions { IsUpsert = true },
            cancellationToken);
    }

    private static TenantParams MapToDomain(TenantParamsDocument doc)
    {
        return TenantParams.Restore(
            doc.TenantId,
            doc.Params.Select(p => ParamDefinition.Restore(p.Key, p.Label, p.Category, p.ExampleValue)).ToArray(),
            DateTime.SpecifyKind(doc.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(doc.UpdatedAtUtc, DateTimeKind.Utc));
    }

    private static TenantParamsDocument MapToDocument(TenantParams tenantParams)
    {
        return new TenantParamsDocument
        {
            Id = tenantParams.TenantId,
            TenantId = tenantParams.TenantId,
            Params = tenantParams.Params
                .Select(p => new ParamDefinitionDocument
                {
                    Key = p.Key,
                    Label = p.Label,
                    Category = p.Category,
                    ExampleValue = p.ExampleValue
                })
                .ToArray(),
            CreatedAtUtc = tenantParams.CreatedAtUtc.UtcDateTime,
            UpdatedAtUtc = tenantParams.UpdatedAtUtc.UtcDateTime
        };
    }
}
