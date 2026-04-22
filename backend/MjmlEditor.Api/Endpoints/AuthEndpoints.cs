using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Contracts.Auth;

namespace MjmlEditor.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapPost("/login", async (
                LoginRequest request,
                IAuthService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.LoginAsync(request, cancellationToken)))
            .AllowAnonymous()
            .WithName("Login");

        group.MapGet("/me", async (IAuthService service, CancellationToken cancellationToken) =>
                TypedResults.Ok(await service.GetCurrentUserAsync(cancellationToken)))
            .RequireAuthorization()
            .WithName("GetCurrentUser");

        return endpoints;
    }
}
