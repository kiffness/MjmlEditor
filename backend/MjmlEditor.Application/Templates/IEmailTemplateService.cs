using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.Templates;

public interface IEmailTemplateService
{
    Task<IReadOnlyList<EmailTemplateSummaryDto>> ListAsync(CancellationToken cancellationToken);

    Task<EmailTemplateDto> GetByIdAsync(string id, CancellationToken cancellationToken);

    Task<EmailTemplateDto> CreateAsync(CreateEmailTemplateRequest request, CancellationToken cancellationToken);

    Task<EmailTemplateDto> UpdateAsync(string id, UpdateEmailTemplateRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<EmailTemplateRevisionDto>> ListRevisionsAsync(string id, CancellationToken cancellationToken);

    Task<EmailTemplateDto> PublishAsync(string id, CancellationToken cancellationToken);

    Task<EmailTemplateDto> RollbackAsync(string id, RollbackEmailTemplateRequest request, CancellationToken cancellationToken);

    Task DeleteAsync(string id, CancellationToken cancellationToken);
}
