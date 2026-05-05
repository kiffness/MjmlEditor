using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Exceptions;
using MjmlEditor.Application.Tenancy;
using MjmlEditor.Domain.BrandLibrary;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

internal sealed class EmailTemplateService(
    IEmailTemplateRepository repository,
    ICurrentUserAccessor currentUserAccessor,
    ITenantContextAccessor tenantContextAccessor,
    IEmailTemplateMjmlGenerator mjmlGenerator,
    IBrandLibraryRepository brandLibraryRepository) : IEmailTemplateService
{
    public async Task<IReadOnlyList<EmailTemplateSummaryDto>> ListAsync(CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var templates = await repository.ListAsync(tenantId, cancellationToken);

        return templates
            .Select(template => template.ToSummaryDto())
            .ToArray();
    }

    public async Task<EmailTemplateDto> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var normalizedId = NormalizeId(id);
        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken);

        return template?.ToDto() ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);
    }

    public async Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var actorUserId = currentUserAccessor.GetRequiredUserId();
        ValidateRequest(EmailTemplateValidation.ValidateCreate(request));
        var editorDocument = request.EditorDocument?.ToDomain();
        var mjmlBody = await BuildCanonicalMjmlAsync(request.MjmlBody, editorDocument, tenantId, cancellationToken);

        var template = EmailTemplate.Create(
            Guid.NewGuid().ToString("N"),
            tenantId,
            request.Name,
            request.Subject,
            mjmlBody,
            editorDocument,
            actorUserId,
            DateTimeOffset.UtcNow);

        await repository.AddAsync(template, cancellationToken);

        return template.ToDto();
    }

    public async Task<EmailTemplateDto> UpdateAsync(string id, UpdateEmailTemplateRequest request, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var actorUserId = currentUserAccessor.GetRequiredUserId();
        var normalizedId = NormalizeId(id);
        ValidateRequest(EmailTemplateValidation.ValidateUpdate(request));

        if (request.Status == EmailTemplateStatus.Published)
        {
            // Publishing is a dedicated workflow because it changes revision semantics beyond a normal draft save.
            throw new RequestValidationException([
                new ValidationError("status", "Use the publish endpoint to publish a template revision.")
            ]);
        }

        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken)
            ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);

        var now = DateTimeOffset.UtcNow;
        var editorDocument = request.EditorDocument?.ToDomain();
        var mjmlBody = await BuildCanonicalMjmlAsync(request.MjmlBody, editorDocument, tenantId, cancellationToken);

        template.Save(
            request.Name,
            request.Subject,
            mjmlBody,
            request.Status,
            editorDocument,
            actorUserId,
            now);

        await repository.UpdateAsync(template, cancellationToken);

        return template.ToDto();
    }

    public async Task<IReadOnlyList<EmailTemplateRevisionDto>> ListRevisionsAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var normalizedId = NormalizeId(id);
        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken)
            ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);

        return template.Revisions
            .OrderByDescending(revision => revision.RevisionNumber)
            .Select(revision => revision.ToDto(template.PublishedRevisionId))
            .ToArray();
    }

    public async Task<EmailTemplateDto> PublishAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var actorUserId = currentUserAccessor.GetRequiredUserId();
        var normalizedId = NormalizeId(id);
        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken)
            ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);

        template.Publish(actorUserId, DateTimeOffset.UtcNow);
        await repository.UpdateAsync(template, cancellationToken);

        return template.ToDto();
    }

    public async Task<EmailTemplateDto> RollbackAsync(string id, RollbackEmailTemplateRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var actorUserId = currentUserAccessor.GetRequiredUserId();
        var normalizedId = NormalizeId(id);
        var template = await repository.GetByIdAsync(tenantId, normalizedId, cancellationToken)
            ?? throw new EntityNotFoundException("EmailTemplate", normalizedId);

        if (string.IsNullOrWhiteSpace(request.RevisionId))
        {
            throw new RequestValidationException([
                new ValidationError("revisionId", "revisionId is required.")
            ]);
        }

        try
        {
            template.RollbackTo(request.RevisionId, actorUserId, DateTimeOffset.UtcNow);
        }
        catch (InvalidOperationException)
        {
            throw new EntityNotFoundException("EmailTemplateRevision", request.RevisionId.Trim());
        }

        await repository.UpdateAsync(template, cancellationToken);

        return template.ToDto();
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var normalizedId = NormalizeId(id);
        var deleted = await repository.DeleteAsync(tenantId, normalizedId, cancellationToken);

        if (!deleted)
        {
            throw new EntityNotFoundException("EmailTemplate", normalizedId);
        }
    }

    private static string NormalizeId(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            throw new RequestValidationException([new ValidationError("id", "id is required.")]);
        }

        return id.Trim();
    }

    private static void ValidateRequest(ValidationResult validationResult)
    {
        if (!validationResult.IsValid)
        {
            throw new RequestValidationException(validationResult.Errors);
        }
    }

    private async Task<string> BuildCanonicalMjmlAsync(string requestedMjmlBody, Domain.Templates.EmailTemplateEditorDocument? editorDocument, string tenantId, CancellationToken cancellationToken)
    {
        // The visual builder is the source of truth whenever an editor document exists; raw MJML is only canonical in text mode.
        if (editorDocument is null)
            return requestedMjmlBody.Trim();

        var brandLibrary = await brandLibraryRepository.GetByTenantIdAsync(tenantId, cancellationToken);
        return mjmlGenerator.Generate(editorDocument, brandLibrary?.DefaultLogoUrl);
    }
}
