using MongoDB.Bson.Serialization.Attributes;

namespace MjmlEditor.Database.BrandLibrary;

public sealed class BrandLibraryDocument
{
    [BsonId]
    public string TenantId { get; init; } = string.Empty;

    public string? SectionDefaultBackgroundColor { get; init; }
    public IReadOnlyList<BrandColorDocument> Colors { get; init; } = [];
    public IReadOnlyList<BrandHeadingStyleDocument> HeadingStyles { get; init; } = [];
    public IReadOnlyList<BrandTextStyleDocument> TextStyles { get; init; } = [];
    public BrandButtonStyleDocument? ButtonStyle { get; init; }
}

public sealed class BrandColorDocument
{
    public string Name { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
}

public sealed class BrandHeadingStyleDocument
{
    public string Level { get; init; } = string.Empty;
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
    public string? Color { get; init; }
}

public sealed class BrandTextStyleDocument
{
    public string Name { get; init; } = string.Empty;
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
    public string? Color { get; init; }
}

public sealed class BrandButtonStyleDocument
{
    public string? BackgroundColor { get; init; }
    public string? TextColor { get; init; }
    public int? BorderRadius { get; init; }
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
}
