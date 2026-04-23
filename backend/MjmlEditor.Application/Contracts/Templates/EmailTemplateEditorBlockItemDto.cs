namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorBlockItemDto
{
    public string Id { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public string Url { get; init; } = string.Empty;
}
