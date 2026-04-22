namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateRevision
{
    public string Id { get; }

    public int RevisionNumber { get; }

    public string Name { get; }

    public string Subject { get; }

    public string MjmlBody { get; }

    public EmailTemplateStatus Status { get; }

    public EmailTemplateRevisionEvent EventType { get; }

    public string ActorUserId { get; }

    public DateTimeOffset CreatedAtUtc { get; }

    public EmailTemplateEditorDocument? EditorDocument { get; }

    public static EmailTemplateRevision Create(
        string id,
        int revisionNumber,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        EmailTemplateRevisionEvent eventType,
        string actorUserId,
        DateTimeOffset createdAtUtc,
        EmailTemplateEditorDocument? editorDocument = null)
    {
        return new EmailTemplateRevision(
            NormalizeRequired(id, nameof(id)),
            ValidateRevisionNumber(revisionNumber),
            NormalizeRequired(name, nameof(name)),
            NormalizeRequired(subject, nameof(subject)),
            NormalizeRequired(mjmlBody, nameof(mjmlBody)),
            ValidateStatus(status),
            ValidateEventType(eventType),
            NormalizeRequired(actorUserId, nameof(actorUserId)),
            NormalizeTimestamp(createdAtUtc, nameof(createdAtUtc)),
            NormalizeEditorDocument(editorDocument));
    }

    public static EmailTemplateRevision Restore(
        string id,
        int revisionNumber,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        EmailTemplateRevisionEvent eventType,
        string actorUserId,
        DateTimeOffset createdAtUtc,
        EmailTemplateEditorDocument? editorDocument = null)
    {
        return Create(id, revisionNumber, name, subject, mjmlBody, status, eventType, actorUserId, createdAtUtc, editorDocument);
    }

    private EmailTemplateRevision(
        string id,
        int revisionNumber,
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateStatus status,
        EmailTemplateRevisionEvent eventType,
        string actorUserId,
        DateTimeOffset createdAtUtc,
        EmailTemplateEditorDocument? editorDocument)
    {
        Id = id;
        RevisionNumber = revisionNumber;
        Name = name;
        Subject = subject;
        MjmlBody = mjmlBody;
        Status = status;
        EventType = eventType;
        ActorUserId = actorUserId;
        CreatedAtUtc = createdAtUtc;
        EditorDocument = editorDocument;
    }

    private static string NormalizeRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", paramName);
        }

        return value.Trim();
    }

    private static int ValidateRevisionNumber(int revisionNumber)
    {
        if (revisionNumber <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(revisionNumber), revisionNumber, "Revision number must be positive.");
        }

        return revisionNumber;
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

    private static EmailTemplateRevisionEvent ValidateEventType(EmailTemplateRevisionEvent value)
    {
        if (!Enum.IsDefined(value))
        {
            throw new ArgumentOutOfRangeException(nameof(value), value, "Unsupported revision event type.");
        }

        return value;
    }

    private static EmailTemplateEditorDocument? NormalizeEditorDocument(EmailTemplateEditorDocument? editorDocument)
    {
        return editorDocument?.Clone();
    }
}
