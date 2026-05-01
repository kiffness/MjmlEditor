namespace MjmlEditor.Application.Contracts.BrandLibrary;

public sealed class BrandLibraryDto
{
    public string? SectionDefaultBackgroundColor { get; init; }
    public IReadOnlyList<BrandColorDto> Colors { get; init; } = [];
    public IReadOnlyList<BrandHeadingStyleDto> HeadingStyles { get; init; } = [];
    public IReadOnlyList<BrandTextStyleDto> TextStyles { get; init; } = [];
    public BrandButtonStyleDto? ButtonStyle { get; init; }
}
