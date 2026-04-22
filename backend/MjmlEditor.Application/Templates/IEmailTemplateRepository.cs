using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public interface IEmailTemplateRepository
{
    Task<IReadOnlyList<EmailTemplate>> ListAsync(string tenantId, CancellationToken cancellationToken);

    Task<EmailTemplate?> GetByIdAsync(string tenantId, string id, CancellationToken cancellationToken);

    Task AddAsync(EmailTemplate template, CancellationToken cancellationToken);

    Task UpdateAsync(EmailTemplate template, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(string tenantId, string id, CancellationToken cancellationToken);
}
