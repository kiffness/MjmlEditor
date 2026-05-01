namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandButtonStyle
{
    public string? BackgroundColor { get; init; }
    public string? TextColor { get; init; }
    public int? BorderRadius { get; init; }
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }

    public static BrandButtonStyle Create(string? backgroundColor, string? textColor, int? borderRadius, string? fontFamily, int? fontSize, string? fontWeight)
    {
        return new BrandButtonStyle
        {
            BackgroundColor = string.IsNullOrWhiteSpace(backgroundColor) ? null : backgroundColor.Trim(),
            TextColor = string.IsNullOrWhiteSpace(textColor) ? null : textColor.Trim(),
            BorderRadius = borderRadius,
            FontFamily = string.IsNullOrWhiteSpace(fontFamily) ? null : fontFamily.Trim(),
            FontSize = fontSize,
            FontWeight = string.IsNullOrWhiteSpace(fontWeight) ? null : fontWeight.Trim()
        };
    }

    public static BrandButtonStyle Restore(string? backgroundColor, string? textColor, int? borderRadius, string? fontFamily, int? fontSize, string? fontWeight) =>
        new() { BackgroundColor = backgroundColor, TextColor = textColor, BorderRadius = borderRadius, FontFamily = fontFamily, FontSize = fontSize, FontWeight = fontWeight };
}
