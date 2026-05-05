namespace MjmlEditor.Domain.Params;

/// <summary>
/// A single template parameter available to a tenant's email campaigns.
/// The <see cref="Key"/> maps to the placeholder <c>{{ params.key }}</c> used in template content.
/// </summary>
public sealed class ParamDefinition
{
    /// <summary>The unique key used in template placeholders, e.g. <c>bedrooms</c> → <c>{{ params.bedrooms }}</c>.</summary>
    public string Key { get; private init; } = string.Empty;

    /// <summary>Human-readable label displayed in the editor param picker.</summary>
    public string Label { get; private init; } = string.Empty;

    /// <summary>Logical group used to organise params in the editor UI (e.g. "Property", "Agent").</summary>
    public string Category { get; private init; } = string.Empty;

    /// <summary>Representative value shown as a preview when the param is inserted into the canvas.</summary>
    public string ExampleValue { get; private init; } = string.Empty;

    /// <summary>Creates and validates a new param definition.</summary>
    public static ParamDefinition Create(string key, string label, string category, string exampleValue)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Key is required.", nameof(key));

        if (string.IsNullOrWhiteSpace(label))
            throw new ArgumentException("Label is required.", nameof(label));

        if (string.IsNullOrWhiteSpace(category))
            throw new ArgumentException("Category is required.", nameof(category));

        return new ParamDefinition
        {
            Key = key.Trim(),
            Label = label.Trim(),
            Category = category.Trim(),
            ExampleValue = exampleValue.Trim()
        };
    }

    /// <summary>Restores a param definition from persistence without re-validating.</summary>
    public static ParamDefinition Restore(string key, string label, string category, string exampleValue)
    {
        return new ParamDefinition
        {
            Key = key,
            Label = label,
            Category = category,
            ExampleValue = exampleValue
        };
    }
}
