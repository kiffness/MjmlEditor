using MjmlEditor.Application.Tenancy;

namespace MjmlEditor.Api.Endpoints;

public static class TenantEndpoints
{
    public static IEndpointRouteBuilder MapTenantEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/tenants", async (ITenantService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.ListAsync(cancellationToken)))
            .WithName("ListTenants")
            .RequireAuthorization()
            .WithTags("Tenants");

        return endpoints;
    }
}
