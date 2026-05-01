using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorColumnDto
{
    public string Id { get; init; } = string.Empty;

    public int WidthPercentage { get; init; }

    public string? BackgroundColor { get; init; }

    public int? Padding { get; init; }

    public EmailTemplateEditorVerticalAlignment? VerticalAlignment { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockDto> Blocks { get; init; } = [];
}
