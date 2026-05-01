using MjmlEditor.Application.BrandLibrary;
using MjmlEditor.Application.Contracts.BrandLibrary;
using MjmlEditor.Infrastructure.Tenancy;

namespace MjmlEditor.Api.Endpoints;

public static class BrandLibraryEndpoints
{
    public static IEndpointRouteBuilder MapBrandLibraryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/brand-library")
            .WithTags("BrandLibrary")
            .RequireAuthorization()
            .AddEndpointFilter<TenantContextEndpointFilter>();

        group.MapGet("", async (IBrandLibraryService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetAsync(cancellationToken)))
            .WithName("GetBrandLibrary");

        group.MapPut("", async (
                BrandLibraryDto dto,
                IBrandLibraryService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.SaveAsync(dto, cancellationToken)))
            .WithName("SaveBrandLibrary");

        return endpoints;
    }
}
