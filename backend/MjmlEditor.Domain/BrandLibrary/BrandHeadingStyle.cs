namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandHeadingStyle
{
    public string Level { get; init; } = string.Empty;
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
    public string? Color { get; init; }

    public static BrandHeadingStyle Create(string level, string? fontFamily, int? fontSize, string? fontWeight, string? color)
    {
        if (string.IsNullOrWhiteSpace(level))
            throw new ArgumentException("Heading level is required.", nameof(level));

        return new BrandHeadingStyle
        {
            Level = level.Trim(),
            FontFamily = string.IsNullOrWhiteSpace(fontFamily) ? null : fontFamily.Trim(),
            FontSize = fontSize,
            FontWeight = string.IsNullOrWhiteSpace(fontWeight) ? null : fontWeight.Trim(),
            Color = string.IsNullOrWhiteSpace(color) ? null : color.Trim()
        };
    }

    public static BrandHeadingStyle Restore(string level, string? fontFamily, int? fontSize, string? fontWeight, string? color) =>
        new() { Level = level, FontFamily = fontFamily, FontSize = fontSize, FontWeight = fontWeight, Color = color };
}
