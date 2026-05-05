using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Domain.SavedSections;

/// <summary>
/// A tenant-scoped reusable section saved to the library.
/// Templates that insert a saved section track the link via <see cref="EmailTemplateEditorSection.SavedSectionId"/>.
/// </summary>
public sealed class SavedSection
{
    public string Id { get; private init; } = string.Empty;

    public string TenantId { get; private init; } = string.Empty;

    public string Name { get; private init; } = string.Empty;

    /// <summary>
    /// The canonical section content stored in the library.
    /// The <see cref="EmailTemplateEditorSection.SavedSectionId"/> within this copy is always <c>null</c>
    /// because it represents the master, not a linked instance.
    /// </summary>
    public EmailTemplateEditorSection SectionData { get; private init; } = null!;

    public DateTimeOffset CreatedAtUtc { get; private init; }

    public DateTimeOffset UpdatedAtUtc { get; private init; }

    /// <summary>Creates a new saved section, validating all required fields.</summary>
    public static SavedSection Create(
        string id,
        string tenantId,
        string name,
        EmailTemplateEditorSection sectionData,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(sectionData);

        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Id is required.", nameof(id));

        if (string.IsNullOrWhiteSpace(tenantId))
            throw new ArgumentException("TenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.", nameof(name));

        return new SavedSection
        {
            Id = id.Trim(),
            TenantId = tenantId.Trim(),
            Name = name.Trim(),
            SectionData = sectionData.Clone(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
    }

    /// <summary>Restores a saved section from persistence without re-validating or cloning.</summary>
    public static SavedSection Restore(
        string id,
        string tenantId,
        string name,
        EmailTemplateEditorSection sectionData,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc)
    {
        return new SavedSection
        {
            Id = id,
            TenantId = tenantId,
            Name = name,
            SectionData = sectionData,
            CreatedAtUtc = createdAtUtc,
            UpdatedAtUtc = updatedAtUtc
        };
    }

    /// <summary>Returns a new instance with an updated name.</summary>
    public SavedSection Rename(string name, DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required.", nameof(name));

        return new SavedSection
        {
            Id = Id,
            TenantId = TenantId,
            Name = name.Trim(),
            SectionData = SectionData,
            CreatedAtUtc = CreatedAtUtc,
            UpdatedAtUtc = now
        };
    }

    /// <summary>Returns a new instance with updated section content.</summary>
    public SavedSection Update(EmailTemplateEditorSection sectionData, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(sectionData);

        return new SavedSection
        {
            Id = Id,
            TenantId = TenantId,
            Name = Name,
            SectionData = sectionData.Clone(),
            CreatedAtUtc = CreatedAtUtc,
            UpdatedAtUtc = now
        };
    }
}
