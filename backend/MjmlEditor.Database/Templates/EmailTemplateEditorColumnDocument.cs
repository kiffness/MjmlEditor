using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateEditorColumnDocument
{
    public string Id { get; init; } = string.Empty;

    public int WidthPercentage { get; init; }

    public string? BackgroundColor { get; init; }

    public int? Padding { get; init; }

    public EmailTemplateEditorVerticalAlignment? VerticalAlignment { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockDocument> Blocks { get; init; } = [];
}
