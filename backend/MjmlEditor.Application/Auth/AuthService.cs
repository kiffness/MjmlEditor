using MjmlEditor.Application.Contracts.Auth;
using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Application.Exceptions;

namespace MjmlEditor.Application.Auth;

internal sealed class AuthService(
    IUserAccountRepository userAccountRepository,
    IUserPasswordHasher passwordHasher,
    IJwtTokenFactory jwtTokenFactory,
    ICurrentUserAccessor currentUserAccessor) : IAuthService
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        ValidateLoginRequest(request);

        var normalizedEmail = request.Email.Trim();
        var userAccount = await userAccountRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (userAccount is null || !passwordHasher.VerifyHashedPassword(userAccount.PasswordHash, request.Password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var accessToken = jwtTokenFactory.CreateToken(userAccount);

        return new LoginResponse(
            accessToken.Value,
            accessToken.ExpiresAtUtc,
            userAccount.ToDto());
    }

    public async Task<AuthenticatedUserDto> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserAccessor.GetRequiredUserId();
        var userAccount = await userAccountRepository.GetByIdAsync(userId, cancellationToken);

        if (userAccount is null)
        {
            throw new UnauthorizedAccessException("The authenticated user could not be found.");
        }

        return userAccount.ToDto();
    }

    private static void ValidateLoginRequest(LoginRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<ValidationError> errors = [];

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors.Add(new ValidationError("email", "email is required."));
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            errors.Add(new ValidationError("password", "password is required."));
        }

        if (errors.Count > 0)
        {
            throw new RequestValidationException(errors);
        }
    }
}
