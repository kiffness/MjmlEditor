using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Application.Exceptions;
using MjmlEditor.Application.Tenancy;

namespace MjmlEditor.Application.Templates;

internal sealed class MjmlTemplateService(
    IEmailTemplateRepository repository,
    ITenantContextAccessor tenantContextAccessor,
    IMjmlRenderer renderer,
    IEmailTemplateMjmlGenerator mjmlGenerator) : IMjmlTemplateService
{
    public async Task<RenderMjmlResponse> RenderAsync(RenderMjmlRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var mjmlBody = request.EditorDocument is null
            ? NormalizeRequiredBody(request.MjmlBody, "mjmlBody")
            : mjmlGenerator.Generate(request.EditorDocument.ToDomain());

        var result = await renderer.RenderAsync(mjmlBody, cancellationToken);
        return result.ToResponse();
    }

    public async Task<RenderMjmlResponse> RenderByTemplateIdAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var normalizedId = NormalizeId(id);
        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken)
            ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);

        var result = await renderer.RenderAsync(template.MjmlBody, cancellationToken);
        return result.ToResponse();
    }

    public Task<TranslateHtmlResponse> TranslateHtmlAsync(TranslateHtmlRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        NormalizeRequiredBody(request.HtmlBody, "htmlBody");

        throw new NotSupportedException(
            "HTML to MJML translation is not supported yet. Keep MJML as the source of truth and treat HTML as a rendered output.");
    }

    private static string NormalizeId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new RequestValidationException([new ValidationError("id", "id is required.")]);
        }

        return id.Trim();
    }

    private static string NormalizeRequiredBody(string value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new RequestValidationException([new ValidationError(field, $"{field} is required.")]);
        }

        return value.Trim();
    }
}
