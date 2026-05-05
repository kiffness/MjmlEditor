namespace MjmlEditor.Database.Params;

public sealed class ParamDefinitionDocument
{
    public string Key { get; init; } = string.Empty;

    public string Label { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public string ExampleValue { get; init; } = string.Empty;
}
