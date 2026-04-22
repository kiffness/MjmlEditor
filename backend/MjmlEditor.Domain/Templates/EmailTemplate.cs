namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplate
{
    private readonly List<EmailTemplateRevision> revisions;

    public string Id { get; private set; }

    public string TenantId { get; private set; }

    public string Name { get; private set; }

    public string Subject { get; private set; }

    public string MjmlBody { get; private set; }

    public EmailTemplateStatus Status { get; private set; }

    public DateTimeOffset CreatedAtUtc { get; private set; }

    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public IReadOnlyList<EmailTemplateRevision> Revisions => revisions;

    public string? PublishedRevisionId { get; private set; }

    public int CurrentRevisionNumber => revisions.Count == 0 ? 0 : revisions[^1].RevisionNumber;

    public EmailTemplateEditorDocument? EditorDocument { get; private set; }

    public static EmailTemplate Create(
        string id,
        string tenantId,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateEditorDocument? editorDocument,
        string actorUserId,
        DateTimeOffset createdAtUtc,
        EmailTemplateStatus status = EmailTemplateStatus.Draft)
    {
        var template = new EmailTemplate(
            NormalizeRequired(id, nameof(id)),
            NormalizeRequired(tenantId, nameof(tenantId)),
            NormalizeRequired(name, nameof(name)),
            NormalizeRequired(subject, nameof(subject)),
            NormalizeRequired(mjmlBody, nameof(mjmlBody)),
            ValidateStatus(status),
            NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc)),
            NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc)),
            [],
            null,
            NormalizeEditorDocument(editorDocument));

        template.AddRevision(EmailTemplateRevisionEvent.Created, NormalizeRequired(actorUserId, nameof(actorUserId)), createdAtUtc);
        return template;
    }

    public static EmailTemplate Restore(
        string id,
        string tenantId,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc,
        IReadOnlyList<EmailTemplateRevision> revisions,
        string? publishedRevisionId,
        EmailTemplateEditorDocument? editorDocument)
    {
        var normalizedCreatedAt = NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc));
        var normalizedUpdatedAt = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));

        if (normalizedUpdatedAt < normalizedCreatedAt)
        {
            throw new ArgumentException("UpdatedAtUtc cannot be earlier than CreatedAtUtc.", nameof(updatedAtUtc));
        }

        return new EmailTemplate(
            NormalizeRequired(id, nameof(id)),
            NormalizeRequired(tenantId, nameof(tenantId)),
            NormalizeRequired(name, nameof(name)),
            NormalizeRequired(subject, nameof(subject)),
            NormalizeRequired(mjmlBody, nameof(mjmlBody)),
            ValidateStatus(status),
            normalizedCreatedAt,
            normalizedUpdatedAt,
            NormalizeRevisions(revisions),
            NormalizeOptional(publishedRevisionId),
            NormalizeEditorDocument(editorDocument));
    }

    public void Save(
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        EmailTemplateEditorDocument? editorDocument,
        string actorUserId,
        DateTimeOffset updatedAtUtc)
    {
        Name = NormalizeRequired(name, nameof(name));
        Subject = NormalizeRequired(subject, nameof(subject));
        MjmlBody = NormalizeRequired(mjmlBody, nameof(mjmlBody));
        Status = ValidateStatus(status);
        UpdatedAtUtc = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));
        EditorDocument = NormalizeEditorDocument(editorDocument);

        AddRevision(
            status == EmailTemplateStatus.Archived ? EmailTemplateRevisionEvent.Archived : EmailTemplateRevisionEvent.DraftSaved,
            NormalizeRequired(actorUserId, nameof(actorUserId)),
            updatedAtUtc);
    }

    public void Publish(string actorUserId, DateTimeOffset updatedAtUtc)
    {
        Status = EmailTemplateStatus.Published;
        UpdatedAtUtc = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));

        var revision = AddRevision(
            EmailTemplateRevisionEvent.Published,
            NormalizeRequired(actorUserId, nameof(actorUserId)),
            updatedAtUtc);

        PublishedRevisionId = revision.Id;
    }

    public void RollbackTo(string revisionId, string actorUserId, DateTimeOffset updatedAtUtc)
    {
        var revision = revisions.SingleOrDefault(current => string.Equals(current.Id, NormalizeRequired(revisionId, nameof(revisionId)), StringComparison.Ordinal))
            ?? throw new InvalidOperationException("The requested template revision was not found.");

        Name = revision.Name;
        Subject = revision.Subject;
        MjmlBody = revision.MjmlBody;
        Status = revision.Status;
        UpdatedAtUtc = NormalizeTimestamp(updatedAtUtc, nameof(updatedAtUtc));
        EditorDocument = NormalizeEditorDocument(revision.EditorDocument);

        var rollbackRevision = AddRevision(
            EmailTemplateRevisionEvent.RolledBack,
            NormalizeRequired(actorUserId, nameof(actorUserId)),
            updatedAtUtc);

        PublishedRevisionId = Status == EmailTemplateStatus.Published
            ? rollbackRevision.Id
            : null;
    }

    private EmailTemplate(
        string id,
        string tenantId,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        DateTimeOffset createdAtUtc,
        DateTimeOffset updatedAtUtc,
        IReadOnlyList<EmailTemplateRevision> revisions,
        string? publishedRevisionId,
        EmailTemplateEditorDocument? editorDocument)
    {
        Id = id;
        TenantId = tenantId;
        Name = name;
        Subject = subject;
        MjmlBody = mjmlBody;
        Status = status;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = updatedAtUtc;
        this.revisions = [.. revisions];
        PublishedRevisionId = publishedRevisionId;
        EditorDocument = editorDocument;
    }

    private EmailTemplateRevision AddRevision(
        EmailTemplateRevisionEvent eventType,
        string actorUserId,
        DateTimeOffset createdAtUtc)
    {
        var revision = EmailTemplateRevision.Create(
            Guid.NewGuid().ToString("N"),
            revisions.Count + 1,
            Name,
            Subject,
            MjmlBody,
            Status,
            eventType,
            actorUserId,
            createdAtUtc,
            EditorDocument);

        revisions.Add(revision);
        return revision;
    }

    private static string NormalizeRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", paramName);
        }

        return value.Trim();
    }

    private static DateTimeOffset NormalizeTimestamp(DateTimeOffset value, string paramName)
    {
        if (value == default)
        {
            throw new ArgumentException("A valid timestamp is required.", paramName);
        }

        return value.ToUniversalTime();
    }

    private static EmailTemplateStatus ValidateStatus(EmailTemplateStatus value)
    {
        if (!Enum.IsDefined(value))
        {
            throw new ArgumentOutOfRangeException(nameof(value), value, "Unsupported template status.");
        }

        return value;
    }

    private static IReadOnlyList<EmailTemplateRevision> NormalizeRevisions(IReadOnlyList<EmailTemplateRevision> revisions)
    {
        ArgumentNullException.ThrowIfNull(revisions);

        if (revisions.Count == 0)
        {
            throw new ArgumentException("At least one revision is required.", nameof(revisions));
        }

        return revisions
            .OrderBy(revision => revision.RevisionNumber)
            .ToArray();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static EmailTemplateEditorDocument? NormalizeEditorDocument(EmailTemplateEditorDocument? editorDocument)
    {
        return editorDocument?.Clone();
    }
}
