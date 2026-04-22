using MjmlEditor.Application.Auth;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Domain.Users;
using MongoDB.Driver;

namespace MjmlEditor.Database.Users;

internal sealed class MongoUserAccountRepository : IUserAccountRepository
{
    private readonly IMongoCollection<UserAccountDocument> collection;

    public MongoUserAccountRepository(IMongoDatabase database, MongoDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(options);

        collection = database.GetCollection<UserAccountDocument>(options.UsersCollectionName);
    }

    public async Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToUpperInvariant();
        var document = await collection
            .Find(user => user.NormalizedEmail == normalizedEmail)
            .SingleOrDefaultAsync(cancellationToken);

        return document?.ToDomain();
    }

    public async Task<UserAccount?> GetByIdAsync(string userId, CancellationToken cancellationToken)
    {
        var normalizedUserId = userId.Trim();
        var document = await collection
            .Find(user => user.Id == normalizedUserId)
            .SingleOrDefaultAsync(cancellationToken);

        return document?.ToDomain();
    }

    public Task<bool> HasTenantAccessAsync(string userId, string tenantId, CancellationToken cancellationToken)
    {
        var normalizedUserId = userId.Trim();
        var normalizedTenantId = tenantId.Trim();

        return collection
            .Find(user =>
                user.Id == normalizedUserId
                && user.Memberships.Any(membership => membership.TenantId == normalizedTenantId))
            .AnyAsync(cancellationToken);
    }
}

internal static class UserAccountDocumentMappings
{
    public static UserAccount ToDomain(this UserAccountDocument document)
    {
        return UserAccount.Restore(
            document.Id,
            document.Email,
            document.DisplayName,
            document.PasswordHash,
            document.Memberships
                .Select(membership => new TenantMembership(
                    membership.TenantId,
                    Enum.Parse<TenantMembershipRole>(membership.Role, ignoreCase: true)))
                .ToArray(),
            DateTime.SpecifyKind(document.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(document.UpdatedAtUtc, DateTimeKind.Utc));
    }
}
