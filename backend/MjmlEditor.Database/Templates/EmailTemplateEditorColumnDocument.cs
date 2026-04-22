namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateEditorColumnDocument
{
    public string Id { get; init; } = string.Empty;

    public int WidthPercentage { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockDocument> Blocks { get; init; } = [];
}
