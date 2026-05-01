namespace MjmlEditor.Domain.BrandLibrary;

public sealed class BrandColor
{
    public string Name { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;

    public static BrandColor Create(string name, string value)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Color name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Color value is required.", nameof(value));

        return new BrandColor { Name = name.Trim(), Value = value.Trim() };
    }

    public static BrandColor Restore(string name, string value) =>
        new() { Name = name, Value = value };
}
