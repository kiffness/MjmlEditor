namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorDocument
{
    public int Version { get; }

    public IReadOnlyList<EmailTemplateEditorSection> Sections { get; }

    public static EmailTemplateEditorDocument Create(int version, IReadOnlyList<EmailTemplateEditorSection> sections)
    {
        ArgumentNullException.ThrowIfNull(sections);

        if (version <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(version), version, "Version must be positive.");
        }

        if (sections.Count == 0)
        {
            throw new ArgumentException("At least one section is required.", nameof(sections));
        }

        return new EmailTemplateEditorDocument(
            version,
            sections.Select(section => section.Clone()).ToArray());
    }

    public static EmailTemplateEditorDocument Restore(int version, IReadOnlyList<EmailTemplateEditorSection> sections)
    {
        return Create(version, sections);
    }

    public EmailTemplateEditorDocument Clone()
    {
        return Restore(Version, Sections);
    }

    private EmailTemplateEditorDocument(int version, IReadOnlyList<EmailTemplateEditorSection> sections)
    {
        Version = version;
        Sections = sections;
    }
}
