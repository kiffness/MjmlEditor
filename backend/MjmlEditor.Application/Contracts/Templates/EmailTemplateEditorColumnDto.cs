namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorColumnDto
{
    public string Id { get; init; } = string.Empty;

    public int WidthPercentage { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockDto> Blocks { get; init; } = [];
}
