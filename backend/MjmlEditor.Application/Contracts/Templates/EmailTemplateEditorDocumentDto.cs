namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorDocumentDto
{
    public int Version { get; init; } = 1;

    public IReadOnlyList<EmailTemplateEditorSectionDto> Sections { get; init; } = [];
}
