using MjmlEditor.Domain.Users;

namespace MjmlEditor.Application.Auth;

public interface IUserAccountRepository
{
    Task<UserAccount?> GetByEmailAsync(string email, CancellationToken cancellationToken);

    Task<UserAccount?> GetByIdAsync(string userId, CancellationToken cancellationToken);

    Task<bool> HasTenantAccessAsync(string userId, string tenantId, CancellationToken cancellationToken);
}
