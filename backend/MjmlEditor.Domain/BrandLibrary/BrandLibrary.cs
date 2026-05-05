namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandLibrary
{
    public string TenantId { get; private init; } = string.Empty;
    public string? SectionDefaultBackgroundColor { get; private init; }
    public string? DefaultLogoUrl { get; private init; }
    public string? DefaultLogoAltText { get; private init; }
    public IReadOnlyList<BrandColor> Colors { get; private init; } = [];
    public IReadOnlyList<BrandHeadingStyle> HeadingStyles { get; private init; } = [];
    public IReadOnlyList<BrandTextStyle> TextStyles { get; private init; } = [];
    public BrandButtonStyle? ButtonStyle { get; private init; }

    public static BrandLibrary Create(
        string tenantId,
        string? sectionDefaultBackgroundColor,
        string? defaultLogoUrl,
        string? defaultLogoAltText,
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
            DefaultLogoUrl = string.IsNullOrWhiteSpace(defaultLogoUrl) ? null : defaultLogoUrl.Trim(),
            DefaultLogoAltText = string.IsNullOrWhiteSpace(defaultLogoAltText) ? null : defaultLogoAltText.Trim(),
            Colors = colors ?? [],
            HeadingStyles = headingStyles ?? [],
            TextStyles = textStyles ?? [],
            ButtonStyle = buttonStyle
        };
    }

    public static BrandLibrary Restore(
        string tenantId,
        string? sectionDefaultBackgroundColor,
        string? defaultLogoUrl,
        string? defaultLogoAltText,
        IReadOnlyList<BrandColor>? colors,
        IReadOnlyList<BrandHeadingStyle>? headingStyles,
        IReadOnlyList<BrandTextStyle>? textStyles,
        BrandButtonStyle? buttonStyle) =>
        new()
        {
            TenantId = tenantId,
            SectionDefaultBackgroundColor = sectionDefaultBackgroundColor,
            DefaultLogoUrl = defaultLogoUrl,
            DefaultLogoAltText = defaultLogoAltText,
            Colors = colors ?? [],
            HeadingStyles = headingStyles ?? [],
            TextStyles = textStyles ?? [],
            ButtonStyle = buttonStyle
        };
}
