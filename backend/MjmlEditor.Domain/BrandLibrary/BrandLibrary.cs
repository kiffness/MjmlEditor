namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandLibrary
{
    public string TenantId { get; private init; } = string.Empty;
    public string? SectionDefaultBackgroundColor { get; private init; }
    public IReadOnlyList<BrandColor> Colors { get; private init; } = [];
    public IReadOnlyList<BrandHeadingStyle> HeadingStyles { get; private init; } = [];
    public IReadOnlyList<BrandTextStyle> TextStyles { get; private init; } = [];
    public BrandButtonStyle? ButtonStyle { get; private init; }

    public static BrandLibrary Create(
        string tenantId,
        string? sectionDefaultBackgroundColor,
        IReadOnlyList<BrandColor>? colors,
        IReadOnlyList<BrandHeadingStyle>? headingStyles,
        IReadOnlyList<BrandTextStyle>? textStyles,
        BrandButtonStyle? buttonStyle)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            throw new ArgumentException("TenantId is required.", nameof(tenantId));

        return new BrandLibrary
        {
            TenantId = tenantId.Trim(),
            SectionDefaultBackgroundColor = string.IsNullOrWhiteSpace(sectionDefaultBackgroundColor) ? null : sectionDefaultBackgroundColor.Trim(),
            Colors = colors ?? [],
            HeadingStyles = headingStyles ?? [],
            TextStyles = textStyles ?? [],
            ButtonStyle = buttonStyle
        };
    }

    public static BrandLibrary Restore(
        string tenantId,
        string? sectionDefaultBackgroundColor,
        IReadOnlyList<BrandColor>? colors,
        IReadOnlyList<BrandHeadingStyle>? headingStyles,
        IReadOnlyList<BrandTextStyle>? textStyles,
        BrandButtonStyle? buttonStyle) =>
        new()
        {
            TenantId = tenantId,
            SectionDefaultBackgroundColor = sectionDefaultBackgroundColor,
            Colors = colors ?? [],
            HeadingStyles = headingStyles ?? [],
            TextStyles = textStyles ?? [],
            ButtonStyle = buttonStyle
        };
}
