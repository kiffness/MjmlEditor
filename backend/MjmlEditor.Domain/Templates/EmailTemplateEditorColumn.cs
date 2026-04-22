namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorColumn
{
    public string Id { get; }

    public int WidthPercentage { get; }

    public IReadOnlyList<EmailTemplateEditorBlock> Blocks { get; }

    public static EmailTemplateEditorColumn Create(
        string id,
        int widthPercentage,
        IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        ArgumentNullException.ThrowIfNull(blocks);

        if (widthPercentage <= 0 || widthPercentage > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(widthPercentage), widthPercentage, "WidthPercentage must be between 1 and 100.");
        }

        return new EmailTemplateEditorColumn(
            NormalizeRequired(id, nameof(id)),
            widthPercentage,
            blocks.Select(block => block.Clone()).ToArray());
    }

    public static EmailTemplateEditorColumn Restore(
        string id,
        int widthPercentage,
        IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        return Create(id, widthPercentage, blocks);
    }

    public EmailTemplateEditorColumn Clone()
    {
        return Restore(Id, WidthPercentage, Blocks);
    }

    private EmailTemplateEditorColumn(string id, int widthPercentage, IReadOnlyList<EmailTemplateEditorBlock> blocks)
    {
        Id = id;
        WidthPercentage = widthPercentage;
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
}
