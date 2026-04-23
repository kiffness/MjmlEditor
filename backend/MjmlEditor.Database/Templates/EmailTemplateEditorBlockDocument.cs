using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Database.Templates;

public sealed class EmailTemplateEditorBlockDocument
{
    public string Id { get; init; } = string.Empty;

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorBlockType Type { get; init; }

    public string? TextContent { get; init; }

    public string? SecondaryText { get; init; }

    public string? ImageUrl { get; init; }

    public string? AltText { get; init; }

    public string? ActionLabel { get; init; }

    public string? ActionUrl { get; init; }

    public string? BackgroundColor { get; init; }

    public string? TextColor { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorAlignment? Alignment { get; init; }

    public string? FontFamily { get; init; }

    public string? FontWeight { get; init; }

    public int? FontSize { get; init; }

    public int? LineHeight { get; init; }

    public int? LetterSpacing { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorTextTransform? TextTransform { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorTextDecoration? TextDecoration { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorBlockLayout? Layout { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorBlockActionPlacement? ActionPlacement { get; init; }

    public int? Spacing { get; init; }

    public string? DividerColor { get; init; }

    public int? DividerThickness { get; init; }

    public string? BorderColor { get; init; }

    public int? BorderWidth { get; init; }

    public int? BorderRadius { get; init; }

    public int? WidthPercentage { get; init; }

    public IReadOnlyList<EmailTemplateEditorBlockItemDocument> Items { get; init; } = [];
}
