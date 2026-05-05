using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.Contracts.SavedSections;

public sealed record SavedSectionDto(
    string Id,
    string Name,
    EmailTemplateEditorSectionDto SectionData,
    string CreatedAtUtc,
    string UpdatedAtUtc);
