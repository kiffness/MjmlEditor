namespace MjmlEditor.Application.Contracts.BrandLibrary;

public sealed class BrandTextStyleDto
{
    public string Name { get; init; } = string.Empty;
    public string? FontFamily { get; init; }
    public int? FontSize { get; init; }
    public string? FontWeight { get; init; }
    public string? Color { get; init; }
}
