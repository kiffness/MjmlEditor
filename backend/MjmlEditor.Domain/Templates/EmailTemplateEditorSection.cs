namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorSection
{
    public string Id { get; }

    public string? BackgroundColor { get; }

    public int? Padding { get; }

    /// <summary>
    /// When set, this section is linked to a saved section in the library with this id.
    /// Linked sections are read-only in the main canvas and must be edited via the Linked Section Editor.
    /// </summary>
    public string? SavedSectionId { get; }

    public IReadOnlyList<EmailTemplateEditorColumn> Columns { get; }

    public static EmailTemplateEditorSection Create(
        string id,
        string? backgroundColor,
        int? padding,
        string? savedSectionId,
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
            NormalizeOptional(savedSectionId),
            columns.Select(column => column.Clone()).ToArray());
    }

    public static EmailTemplateEditorSection Restore(
        string id,
        string? backgroundColor,
        int? padding,
        string? savedSectionId,
        IReadOnlyList<EmailTemplateEditorColumn> columns)
    {
        return Create(id, backgroundColor, padding, savedSectionId, columns);
    }

    public EmailTemplateEditorSection Clone()
    {
        return Restore(Id, BackgroundColor, Padding, SavedSectionId, Columns);
    }

    private EmailTemplateEditorSection(
        string id,
        string? backgroundColor,
        int? padding,
        string? savedSectionId,
        IReadOnlyList<EmailTemplateEditorColumn> columns)
    {
        Id = id;
        BackgroundColor = backgroundColor;
        Padding = padding;
        SavedSectionId = savedSectionId;
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
