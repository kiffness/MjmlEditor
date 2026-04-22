using Microsoft.AspNetCore.Identity;
using MjmlEditor.Application.Auth;

namespace MjmlEditor.Infrastructure.Auth;

internal sealed class PasswordHasherAdapter : IUserPasswordHasher
{
    private readonly PasswordHasher<object> passwordHasher = new();
    private readonly object passwordOwner = new();

    public string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException("Password is required.", nameof(password));
        }

        return passwordHasher.HashPassword(passwordOwner, password);
    }

    public bool VerifyHashedPassword(string passwordHash, string providedPassword)
    {
        if (string.IsNullOrWhiteSpace(passwordHash) || string.IsNullOrWhiteSpace(providedPassword))
        {
            return false;
        }

        var verificationResult = passwordHasher.VerifyHashedPassword(passwordOwner, passwordHash, providedPassword);
        return verificationResult is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
