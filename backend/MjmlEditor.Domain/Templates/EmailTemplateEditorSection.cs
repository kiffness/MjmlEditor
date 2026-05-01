namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorSection
{
    public string Id { get; }

    public string? BackgroundColor { get; }

    public int? Padding { get; }

    public IReadOnlyList<EmailTemplateEditorColumn> Columns { get; }

    public static EmailTemplateEditorSection Create(
        string id,
        string? backgroundColor,
        int? padding,
        IReadOnlyList<EmailTemplateEditorColumn> columns)
    {
        ArgumentNullException.ThrowIfNull(columns);

        if (columns.Count == 0)
        {
            throw new ArgumentException("At least one column is required.", nameof(columns));
        }

        if (padding is not null && padding < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(padding), padding, "Padding must be zero or greater when provided.");
        }

        return new EmailTemplateEditorSection(
            NormalizeRequired(id, nameof(id)),
            NormalizeOptional(backgroundColor),
            padding,
            columns.Select(column => column.Clone()).ToArray());
    }

    public static EmailTemplateEditorSection Restore(
        string id,
        string? backgroundColor,
        int? padding,
        IReadOnlyList<EmailTemplateEditorColumn> columns)
    {
        return Create(id, backgroundColor, padding, columns);
    }

    public EmailTemplateEditorSection Clone()
    {
        return Restore(Id, BackgroundColor, Padding, Columns);
    }

    private EmailTemplateEditorSection(
        string id,
        string? backgroundColor,
        int? padding,
        IReadOnlyList<EmailTemplateEditorColumn> columns)
    {
        Id = id;
        BackgroundColor = backgroundColor;
        Padding = padding;
        Columns = columns;
    }

    private static string NormalizeRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", paramName);
        }

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
