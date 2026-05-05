namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateEditorSectionDocument
{
    public string Id { get; init; } = string.Empty;

    public string? BackgroundColor { get; init; }

    public int? Padding { get; init; }

    public string? SavedSectionId { get; init; }

    public IReadOnlyList<EmailTemplateEditorColumnDocument> Columns { get; init; } = [];
}
