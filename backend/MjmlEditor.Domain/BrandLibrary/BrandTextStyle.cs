namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandTextStyle
{
    public string Name { get; init; } = string.Empty;
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
    public string? Color { get; init; }

    public static BrandTextStyle Create(string name, string? fontFamily, int? fontSize, string? fontWeight, string? color)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Text style name is required.", nameof(name));

        return new BrandTextStyle
        {
            Name = name.Trim(),
            FontFamily = string.IsNullOrWhiteSpace(fontFamily) ? null : fontFamily.Trim(),
            FontSize = fontSize,
            FontWeight = string.IsNullOrWhiteSpace(fontWeight) ? null : fontWeight.Trim(),
            Color = string.IsNullOrWhiteSpace(color) ? null : color.Trim()
        };
    }

    public static BrandTextStyle Restore(string name, string? fontFamily, int? fontSize, string? fontWeight, string? color) =>
        new() { Name = name, FontFamily = fontFamily, FontSize = fontSize, FontWeight = fontWeight, Color = color };
}
