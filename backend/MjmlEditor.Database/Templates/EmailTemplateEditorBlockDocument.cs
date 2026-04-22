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

    public string? ImageUrl { get; init; }

    public string? AltText { get; init; }

    public string? ActionLabel { get; init; }

    public string? ActionUrl { get; init; }

    public string? BackgroundColor { get; init; }

    public string? TextColor { get; init; }

    [BsonRepresentation(BsonType.String)]
    public EmailTemplateEditorAlignment? Alignment { get; init; }

    public int? FontSize { get; init; }

    public int? Spacing { get; init; }

    public string? DividerColor { get; init; }

    public int? DividerThickness { get; init; }
}
