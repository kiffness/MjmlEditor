using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.Templates;

public interface IEmailTemplateService
{
    /// <summary>
    /// Lists the templates visible to the active tenant.
    /// </summary>
    Task<IReadOnlyList<EmailTemplateSummaryDto>> ListAsync(CancellationToken cancellationToken);

    /// <summary>
    /// Loads a single template by identifier for the active tenant.
    /// </summary>
    Task<EmailTemplateDto> GetByIdAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new draft template and persists its first revision.
    /// </summary>
    Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Saves a new draft revision for an existing template.
    /// </summary>
    Task<EmailTemplateDto> UpdateAsync(string id, UpdateEmailTemplateRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Lists all stored revisions for a template, newest first.
    /// </summary>
    Task<IReadOnlyList<EmailTemplateRevisionDto>> ListRevisionsAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Publishes the latest draft revision for a template.
    /// </summary>
    Task<EmailTemplateDto> PublishAsync(string id, CancellationToken cancellationToken);

    /// <summary>
    /// Restores a template to a previous revision and records a new rollback revision.
    /// </summary>
    Task<EmailTemplateDto> RollbackAsync(string id, RollbackEmailTemplateRequest request, CancellationToken cancellationToken);

    /// <summary>
    /// Deletes a template owned by the active tenant.
    /// </summary>
    Task DeleteAsync(string id, CancellationToken cancellationToken);
}
