using MjmlEditor.Application.Contracts.Auth;

namespace MjmlEditor.Application.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken);

    Task<AuthenticatedUserDto> GetCurrentUserAsync(CancellationToken cancellationToken);
}
