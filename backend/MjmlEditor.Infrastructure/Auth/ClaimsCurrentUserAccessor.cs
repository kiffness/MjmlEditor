using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using MjmlEditor.Application.Auth;

namespace MjmlEditor.Infrastructure.Auth;

internal sealed class ClaimsCurrentUserAccessor(IHttpContextAccessor httpContextAccessor) : ICurrentUserAccessor
{
    public string GetRequiredUserId()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("Current user resolution requires an active HTTP request.");

        var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Authentication is required.");
        }

        return userId.Trim();
    }
}
