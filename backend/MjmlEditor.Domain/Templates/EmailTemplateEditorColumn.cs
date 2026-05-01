namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorColumn
{
    public string Id { get; }

    public int WidthPercentage { get; }

    public string? BackgroundColor { get; }

    public int? Padding { get; }

    public EmailTemplateEditorVerticalAlignment? VerticalAlignment { get; }

    public IReadOnlyList<EmailTemplateEditorBlock> Blocks { get; }

    public static EmailTemplateEditorColumn Create(
        string id,
        int widthPercentage,
        string? backgroundColor,
        int? padding,
        EmailTemplateEditorVerticalAlignment? verticalAlignment,
        IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        ArgumentNullException.ThrowIfNull(blocks);

        if (widthPercentage <= 0 || widthPercentage > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(widthPercentage), widthPercentage, "WidthPercentage must be between 1 and 100.");
        }

        if (padding is not null && padding < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(padding), padding, "Padding must be non-negative when provided.");
        }

        if (verticalAlignment is not null && !Enum.IsDefined(verticalAlignment.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(verticalAlignment), verticalAlignment, "Unsupported column vertical alignment.");
        }

        return new EmailTemplateEditorColumn(
            NormalizeRequired(id, nameof(id)),
            widthPercentage,
            NormalizeOptional(backgroundColor),
            padding,
            verticalAlignment,
            blocks.Select(block => block.Clone()).ToArray());
    }

    public static EmailTemplateEditorColumn Restore(
        string id,
        int widthPercentage,
        string? backgroundColor,
        int? padding,
        EmailTemplateEditorVerticalAlignment? verticalAlignment,
        IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        return Create(id, widthPercentage, backgroundColor, padding, verticalAlignment, blocks);
    }

    public EmailTemplateEditorColumn Clone()
    {
        return Restore(Id, WidthPercentage, BackgroundColor, Padding, VerticalAlignment, Blocks);
    }

    private EmailTemplateEditorColumn(
        string id,
        int widthPercentage,
        string? backgroundColor,
        int? padding,
        EmailTemplateEditorVerticalAlignment? verticalAlignment,
        IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        Id = id;
        WidthPercentage = widthPercentage;
        BackgroundColor = backgroundColor;
        Padding = padding;
        VerticalAlignment = verticalAlignment;
        Blocks = blocks;
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
