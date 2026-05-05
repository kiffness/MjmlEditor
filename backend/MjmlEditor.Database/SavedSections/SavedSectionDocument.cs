using MongoDB.Bson.Serialization.Attributes;
using MjmlEditor.Database.Templates;

namespace MjmlEditor.Database.SavedSections;

public sealed class SavedSectionDocument
{
    [BsonId]
    public string Id { get; init; } = string.Empty;

    public string TenantId { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public EmailTemplateEditorSectionDocument SectionData { get; init; } = null!;

    public DateTime CreatedAtUtc { get; init; }

    public DateTime UpdatedAtUtc { get; init; }
}
