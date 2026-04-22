namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateEditorDocument
{
    public int Version { get; init; }

    public IReadOnlyList<EmailTemplateEditorSectionDocument> Sections { get; init; } = [];
}
