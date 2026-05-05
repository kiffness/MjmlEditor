using MjmlEditor.Application.Contracts.SavedSections;
using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.SavedSections;

public interface ISavedSectionService
{
    Task<IReadOnlyList<SavedSectionDto>> ListAsync(CancellationToken cancellationToken);

    /// <summary>Saves a new section to the library and returns the created DTO with the assigned id.</summary>
    Task<SavedSectionDto> CreateAsync(string name, EmailTemplateEditorSectionDto sectionData, CancellationToken cancellationToken);

    /// <summary>Renames an existing saved section without altering its content.</summary>
    Task<SavedSectionDto> RenameAsync(string id, string name, CancellationToken cancellationToken);

    /// <summary>
    /// Updates the saved section's content and propagates the change to every template
    /// that has a section linked to this saved section id.
    /// </summary>
    Task<SavedSectionDto> PropagateAsync(string id, EmailTemplateEditorSectionDto sectionData, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken);
}
