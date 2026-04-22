using MjmlEditor.Application.Contracts.Tenancy;

namespace MjmlEditor.Application.Tenancy;

public interface ITenantService
{
    Task<IReadOnlyList<TenantDto>> ListAsync(CancellationToken cancellationToken);
}
