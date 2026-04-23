using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Contracts.Templates;

public sealed record EmailTemplateEditorBlockDto
{
    public string Id { get; init; } = string.Empty;

    public EmailTemplateEditorBlockType Type { get; init; }

    public string? TextContent { get; init; }

    public string? SecondaryText { get; init; }

    public string? ImageUrl { get; init; }

    public string? AltText { get; init; }

    public string? ActionLabel { get; init; }

    public string? ActionUrl { get; init; }

    public string? BackgroundColor { get; init; }

    public string? TextColor { get; init; }

    public EmailTemplateEditorAlignment? Alignment { get; init; }

    public string? FontFamily { get; init; }

    public string? FontWeight { get; init; }

    public int? FontSize { get; init; }

    public int? LineHeight { get; init; }

    public int? LetterSpacing { get; init; }

    public EmailTemplateEditorTextTransform? TextTransform { get; init; }

    public EmailTemplateEditorTextDecoration? TextDecoration { get; init; }

    public int? Spacing { get; init; }

    public string? DividerColor { get; init; }

    public int? DividerThickness { get; init; }

    public string? BorderColor { get; init; }

    public int? BorderWidth { get; init; }

    public int? BorderRadius { get; init; }

    public int? WidthPercentage { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockItemDto> Items { get; init; } = [];
}
