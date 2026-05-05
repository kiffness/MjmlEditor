using MjmlEditor.Application.Contracts.SavedSections;
using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Exceptions;
using MjmlEditor.Application.Tenancy;
using MjmlEditor.Application.Templates;
using MjmlEditor.Domain.SavedSections;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.SavedSections;

internal sealed class SavedSectionService(
    ISavedSectionRepository repository,
    IEmailTemplateRepository templateRepository,
    IEmailTemplateMjmlGenerator mjmlGenerator,
    ITenantContextAccessor tenantContextAccessor) : ISavedSectionService
{
    public async Task<IReadOnlyList<SavedSectionDto>> ListAsync(CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var sections = await repository.ListByTenantIdAsync(tenantId, cancellationToken);
        return sections.Select(MapToDto).ToArray();
    }

    public async Task<SavedSectionDto> CreateAsync(string name, EmailTemplateEditorSectionDto sectionData, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();

        // Strip any incoming savedSectionId — the library master copy is never self-referential.
        var cleanDto = sectionData with { SavedSectionId = null };
        var domainSection = cleanDto.ToDomain();

        var saved = SavedSection.Create(
            Guid.NewGuid().ToString("N"),
            tenantId,
            name,
            domainSection,
            DateTimeOffset.UtcNow);

        await repository.AddAsync(saved, cancellationToken);
        return MapToDto(saved);
    }

    public async Task<SavedSectionDto> RenameAsync(string id, string name, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var saved = await repository.GetByIdAsync(tenantId, id, cancellationToken)
            ?? throw new EntityNotFoundException("SavedSection", id);

        var renamed = saved.Rename(name, DateTimeOffset.UtcNow);
        await repository.UpdateAsync(renamed, cancellationToken);
        return MapToDto(renamed);
    }

    /// <summary>
    /// Updates the saved section's content and pushes the change to every template that references this saved section.
    /// Each linked section retains its own template-specific id and savedSectionId but receives the new content.
    /// </summary>
    public async Task<SavedSectionDto> PropagateAsync(string id, EmailTemplateEditorSectionDto sectionData, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        var saved = await repository.GetByIdAsync(tenantId, id, cancellationToken)
            ?? throw new EntityNotFoundException("SavedSection", id);

        var cleanDto = sectionData with { SavedSectionId = null };
        var updated = saved.Update(cleanDto.ToDomain(), DateTimeOffset.UtcNow);
        await repository.UpdateAsync(updated, cancellationToken);

        var templates = await templateRepository.ListAsync(tenantId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var template in templates)
        {
            if (template.EditorDocument is null) continue;

            var hasLinked = template.EditorDocument.Sections
                .Any(s => string.Equals(s.SavedSectionId, id, StringComparison.Ordinal));

            if (!hasLinked) continue;

            // Replace each linked section's content while preserving the template-specific section id and the link.
            var updatedSections = template.EditorDocument.Sections
                .Select(section =>
                {
                    if (!string.Equals(section.SavedSectionId, id, StringComparison.Ordinal))
                        return section;

                    return EmailTemplateEditorSection.Restore(
                        section.Id,
                        updated.SectionData.BackgroundColor,
                        updated.SectionData.Padding,
                        id,
                        updated.SectionData.Columns);
                })
                .ToArray();

            var newDocument = EmailTemplateEditorDocument.Restore(template.EditorDocument.Version, updatedSections);
            var newMjmlBody = mjmlGenerator.Generate(newDocument);

            template.Save(
                template.Name,
                template.Subject,
                newMjmlBody,
                template.Status,
                newDocument,
                "system-propagate",
                now);

            await templateRepository.UpdateAsync(template, cancellationToken);
        }

        return MapToDto(updated);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var tenantId = tenantContextAccessor.GetRequiredTenantId();
        return await repository.DeleteAsync(tenantId, id, cancellationToken);
    }

    private static SavedSectionDto MapToDto(SavedSection saved) =>
        new(
            saved.Id,
            saved.Name,
            saved.SectionData.ToDto(),
            saved.CreatedAtUtc.ToString("O"),
            saved.UpdatedAtUtc.ToString("O"));
}
