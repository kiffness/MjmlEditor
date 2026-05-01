using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Templates;
using MjmlEditor.Infrastructure.Tenancy;

namespace MjmlEditor.Api.Endpoints;

public static class EmailTemplateEndpoints
{
    /// <summary>
    /// Registers the authenticated template-management and preview endpoints.
    /// </summary>
    public static IEndpointRouteBuilder MapEmailTemplateEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/templates")
            .WithTags("Templates")
            .RequireAuthorization()
            .AddEndpointFilter<TenantContextEndpointFilter>();

        group.MapGet("/", async (IEmailTemplateService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.ListAsync(cancellationToken)))
            .WithName("ListEmailTemplates");

        group.MapGet("/{id}", async (string id, IEmailTemplateService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.GetByIdAsync(id, cancellationToken)))
            .WithName("GetEmailTemplate");

        group.MapGet("/{id}/revisions", async (string id, IEmailTemplateService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.ListRevisionsAsync(id, cancellationToken)))
            .WithName("ListEmailTemplateRevisions");

        group.MapGet("/{id}/render", async (string id, IMjmlTemplateService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.RenderByTemplateIdAsync(id, cancellationToken)))
            .WithName("RenderStoredEmailTemplate");

        group.MapPost("/", async (
                CreateEmailTemplateRequest request,
                IEmailTemplateService service,
                CancellationToken cancellationToken) =>
            {
                var template = await service.CreateAsync(request, cancellationToken);

                return TypedResults.Created($"/api/templates/{template.Id}", template);
            })
            .WithName("CreateEmailTemplate");

        group.MapPost("/render", async (
                RenderMjmlRequest request,
                IMjmlTemplateService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.RenderAsync(request, cancellationToken)))
            .WithName("RenderEmailTemplatePreview");

        group.MapPost("/translate-html", async (
                TranslateHtmlRequest request,
                IMjmlTemplateService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.TranslateHtmlAsync(request, cancellationToken)))
            .WithName("TranslateHtmlToMjml");

        group.MapPost("/{id}/publish", async (string id, IEmailTemplateService service, CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.PublishAsync(id, cancellationToken)))
            .WithName("PublishEmailTemplate");

        group.MapPost("/{id}/rollback", async (
                string id,
                RollbackEmailTemplateRequest request,
                IEmailTemplateService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.RollbackAsync(id, request, cancellationToken)))
            .WithName("RollbackEmailTemplate");

        group.MapPut("/{id}", async (
                string id,
                UpdateEmailTemplateRequest request,
                IEmailTemplateService service,
                CancellationToken cancellationToken) =>
            TypedResults.Ok(await service.UpdateAsync(id, request, cancellationToken)))
            .WithName("UpdateEmailTemplate");

        group.MapDelete("/{id}", async (string id, IEmailTemplateService service, CancellationToken cancellationToken) =>
        {
            await service.DeleteAsync(id, cancellationToken);
            return TypedResults.NoContent();
        }).WithName("DeleteEmailTemplate");

        return endpoints;
    }
}
