namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorBlockItem
{
    public string Id { get; }

    public string Label { get; }

    public string Url { get; }

    public static EmailTemplateEditorBlockItem Create(string id, string label, string url)
    {
        return new EmailTemplateEditorBlockItem(
            NormalizeRequired(id, nameof(id)),
            NormalizeRequired(label, nameof(label)),
            NormalizeRequired(url, nameof(url)));
    }

    public static EmailTemplateEditorBlockItem Restore(string id, string label, string url)
    {
        return Create(id, label, url);
    }

    public EmailTemplateEditorBlockItem Clone() => Restore(Id, Label, Url);

    private EmailTemplateEditorBlockItem(string id, string label, string url)
    {
        Id = id;
        Label = label;
        Url = url;
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
