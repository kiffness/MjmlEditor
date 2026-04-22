namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorSectionDto
{
    public string Id { get; init; } = string.Empty;

    public string? BackgroundColor { get; init; }

    public int? Padding { get; init; }

    public IReadOnlyList<EmailTemplateEditorColumnDto> Columns { get; init; } = [];
}
