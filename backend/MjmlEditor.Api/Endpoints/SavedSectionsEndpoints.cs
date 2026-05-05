using MjmlEditor.Application.Contracts.SavedSections;
using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.SavedSections;
using MjmlEditor.Infrastructure.Tenancy;

namespace MjmlEditor.Api.Endpoints;

public static class SavedSectionsEndpoints
{
    public static IEndpointRouteBuilder MapSavedSectionsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/saved-sections")
            .WithTags("SavedSections")
            .RequireAuthorization()
            .AddEndpointFilter<TenantContextEndpointFilter>();

        group.MapGet("", async (ISavedSectionService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.ListAsync(cancellationToken)))
            .WithName("ListSavedSections");

        group.MapPost("", async (
                CreateSavedSectionRequest request,
                ISavedSectionService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.CreateAsync(request.Name, request.SectionData, cancellationToken)))
            .WithName("CreateSavedSection");

        group.MapPut("/{id}", async (
                string id,
                RenameSavedSectionRequest request,
                ISavedSectionService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.RenameAsync(id, request.Name, cancellationToken)))
            .WithName("RenameSavedSection");

        group.MapPost("/{id}/propagate", async (
                string id,
                PropagateSavedSectionRequest request,
                ISavedSectionService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.PropagateAsync(id, request.SectionData, cancellationToken)))
            .WithName("PropagateSavedSection");

        group.MapDelete("/{id}", async (
                string id,
                ISavedSectionService service,
                CancellationToken cancellationToken) =>
            {
                await service.DeleteAsync(id, cancellationToken);
                return Results.NoContent();
            })
            .WithName("DeleteSavedSection");

        return endpoints;
    }
}

public sealed record CreateSavedSectionRequest(string Name, EmailTemplateEditorSectionDto SectionData);
public sealed record RenameSavedSectionRequest(string Name);
public sealed record PropagateSavedSectionRequest(EmailTemplateEditorSectionDto SectionData);
