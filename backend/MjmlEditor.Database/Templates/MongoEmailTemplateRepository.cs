using MjmlEditor.Application.Templates;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Domain.Templates;
using MongoDB.Driver;

namespace MjmlEditor.Database.Templates;

internal sealed class MongoEmailTemplateRepository : IEmailTemplateRepository
{
    private readonly IMongoCollection<EmailTemplateDocument> collection;

    public MongoEmailTemplateRepository(IMongoDatabase database, MongoDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(database);
        ArgumentNullException.ThrowIfNull(options);

        collection = database.GetCollection<EmailTemplateDocument>(options.TemplatesCollectionName);
    }

    public async Task<IReadOnlyList<EmailTemplate>> ListAsync(string tenantId, CancellationToken cancellationToken)
    {
        var documents = await collection
            .Find(document => document.TenantId == tenantId)
            .SortByDescending(document => document.UpdatedAtUtc)
            .ToListAsync(cancellationToken);

        return documents
            .Select(MapToDomain)
            .ToArray();
    }

    public async Task<EmailTemplate?> GetByIdAsync(string tenantId, string id, CancellationToken cancellationToken)
    {
        var document = await collection
            .Find(template => template.TenantId == tenantId && template.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return document is null ? null : MapToDomain(document);
    }

    public Task AddAsync(EmailTemplate template, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(template);

        return collection.InsertOneAsync(MapToDocument(template), cancellationToken: cancellationToken);
    }

    public Task UpdateAsync(EmailTemplate template, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(template);

        return collection.ReplaceOneAsync(
            document => document.TenantId == template.TenantId && document.Id == template.Id,
            MapToDocument(template),
            new ReplaceOptions { IsUpsert = false },
            cancellationToken);
    }

    public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken cancellationToken)
    {
        var result = await collection.DeleteOneAsync(
            document => document.TenantId == tenantId && document.Id == id,
            cancellationToken);

        return result.DeletedCount > 0;
    }

    private static EmailTemplate MapToDomain(EmailTemplateDocument document)
    {
        var status = Enum.Parse<EmailTemplateStatus>(document.Status, ignoreCase: true);
        var revisions = document.Revisions.Count == 0
            // Older documents predate revision tracking, so we synthesize an initial revision during hydration.
            ? [CreateLegacyRevision(document, status)]
            : document.Revisions
                .Select(revision => EmailTemplateRevision.Restore(
                    revision.Id,
                    revision.RevisionNumber,
                    revision.Name,
                    revision.Subject,
                    revision.MjmlBody,
                    Enum.Parse<EmailTemplateStatus>(revision.Status, ignoreCase: true),
                    Enum.Parse<EmailTemplateRevisionEvent>(revision.EventType, ignoreCase: true),
                    revision.ActorUserId,
                    DateTime.SpecifyKind(revision.CreatedAtUtc, DateTimeKind.Utc),
                    revision.EditorDocument is null ? null : MapToDomain(revision.EditorDocument)))
                .ToArray();
        // Legacy published documents may not have a stored PublishedRevisionId, so fall back to the latest hydrated revision.
        var publishedRevisionId = string.IsNullOrWhiteSpace(document.PublishedRevisionId) && status == EmailTemplateStatus.Published
            ? revisions[^1].Id
            : document.PublishedRevisionId;

        return EmailTemplate.Restore(
            document.Id,
            document.TenantId,
            document.Name,
            document.Subject,
            document.MjmlBody,
            status,
            DateTime.SpecifyKind(document.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(document.UpdatedAtUtc, DateTimeKind.Utc),
            revisions,
            publishedRevisionId,
            document.EditorDocument is null ? null : MapToDomain(document.EditorDocument));
    }

    private static EmailTemplateDocument MapToDocument(EmailTemplate template)
    {
        return new EmailTemplateDocument
        {
            Id = template.Id,
            TenantId = template.TenantId,
            Name = template.Name,
            Subject = template.Subject,
            MjmlBody = template.MjmlBody,
            Status = template.Status.ToString(),
            EditorDocument = template.EditorDocument is null ? null : MapToDocument(template.EditorDocument),
            PublishedRevisionId = template.PublishedRevisionId,
            Revisions = template.Revisions
                .Select(revision => new EmailTemplateRevisionDocument
                {
                    Id = revision.Id,
                    RevisionNumber = revision.RevisionNumber,
                    Name = revision.Name,
                    Subject = revision.Subject,
                    MjmlBody = revision.MjmlBody,
                    Status = revision.Status.ToString(),
                    EventType = revision.EventType.ToString(),
                    ActorUserId = revision.ActorUserId,
                    EditorDocument = revision.EditorDocument is null ? null : MapToDocument(revision.EditorDocument),
                    CreatedAtUtc = revision.CreatedAtUtc.UtcDateTime
                })
                .ToArray(),
            CreatedAtUtc = template.CreatedAtUtc.UtcDateTime,
            UpdatedAtUtc = template.UpdatedAtUtc.UtcDateTime
        };
    }

    private static EmailTemplateRevision CreateLegacyRevision(EmailTemplateDocument document, EmailTemplateStatus status)
    {
        var eventType = status switch
        {
            EmailTemplateStatus.Published => EmailTemplateRevisionEvent.Published,
            EmailTemplateStatus.Archived => EmailTemplateRevisionEvent.Archived,
            _ => EmailTemplateRevisionEvent.Created
        };

        return EmailTemplateRevision.Restore(
            $"{document.Id}-legacy-initial",
            1,
            document.Name,
            document.Subject,
            document.MjmlBody,
            status,
            eventType,
            "system-migration",
            DateTime.SpecifyKind(document.CreatedAtUtc, DateTimeKind.Utc),
            document.EditorDocument is null ? null : MapToDomain(document.EditorDocument));
    }

    private static Domain.Templates.EmailTemplateEditorDocument MapToDomain(EmailTemplateEditorDocument document)
    {
        return Domain.Templates.EmailTemplateEditorDocument.Restore(
            document.Version,
            document.Sections.Select(section => EmailTemplateEditorSection.Restore(
                section.Id,
                section.BackgroundColor,
                section.Padding,
                section.SavedSectionId,
                section.Columns.Select(column => EmailTemplateEditorColumn.Restore(
                    column.Id,
                    column.WidthPercentage,
                    column.BackgroundColor,
                    column.Padding,
                    column.VerticalAlignment,
                    column.Blocks
                        .Where(block => Enum.TryParse<EmailTemplateEditorBlockType>(block.Type, out _))
                        .Select(block => EmailTemplateEditorBlock.Restore(
                        block.Id,
                        Enum.Parse<EmailTemplateEditorBlockType>(block.Type),
                        block.TextContent,
                        block.SecondaryText,
                        block.ImageUrl,
                        block.AltText,
                        block.ActionLabel,
                        block.ActionUrl,
                        block.BackgroundColor,
                        block.TextColor,
                        block.Alignment,
                        block.FontFamily,
                        block.FontWeight,
                        block.FontSize,
                        block.LineHeight,
                        block.LetterSpacing,
                        block.TextTransform,
                        block.TextDecoration,
                        block.Layout,
                        block.ActionPlacement,
                        block.Spacing,
                        block.DividerColor,
                        block.DividerThickness,
                        block.BorderColor,
                        block.BorderWidth,
                        block.BorderRadius,
                        block.WidthPercentage,
                        block.BlockPadding,
                        block.HeadingLevel,
                        block.Items?.Select(item => EmailTemplateEditorBlockItem.Restore(
                            item.Id,
                            item.Label,
                            item.Url)).ToArray() ?? [])).ToArray())).ToArray())).ToArray());
    }

    private static EmailTemplateEditorDocument MapToDocument(Domain.Templates.EmailTemplateEditorDocument document)
    {
        return new EmailTemplateEditorDocument
        {
            Version = document.Version,
            Sections = document.Sections.Select(section => new EmailTemplateEditorSectionDocument
            {
                Id = section.Id,
                BackgroundColor = section.BackgroundColor,
                Padding = section.Padding,
                SavedSectionId = section.SavedSectionId,
                Columns = section.Columns.Select(column => new EmailTemplateEditorColumnDocument
                {
                    Id = column.Id,
                    WidthPercentage = column.WidthPercentage,
                    BackgroundColor = column.BackgroundColor,
                    Padding = column.Padding,
                    VerticalAlignment = column.VerticalAlignment,
                    Blocks = column.Blocks.Select(block => new EmailTemplateEditorBlockDocument
                    {
                        Id = block.Id,
                        Type = block.Type.ToString(),
                        TextContent = block.TextContent,
                        SecondaryText = block.SecondaryText,
                        ImageUrl = block.ImageUrl,
                        AltText = block.AltText,
                        ActionLabel = block.ActionLabel,
                        ActionUrl = block.ActionUrl,
                        BackgroundColor = block.BackgroundColor,
                        TextColor = block.TextColor,
                        Alignment = block.Alignment,
                        FontFamily = block.FontFamily,
                        FontWeight = block.FontWeight,
                        FontSize = block.FontSize,
                        LineHeight = block.LineHeight,
                        LetterSpacing = block.LetterSpacing,
                        TextTransform = block.TextTransform,
                        TextDecoration = block.TextDecoration,
                        Layout = block.Layout,
                        ActionPlacement = block.ActionPlacement,
                        Spacing = block.Spacing,
                        DividerColor = block.DividerColor,
                        DividerThickness = block.DividerThickness,
                        BorderColor = block.BorderColor,
                        BorderWidth = block.BorderWidth,
                        BorderRadius = block.BorderRadius,
                        WidthPercentage = block.WidthPercentage,
                        BlockPadding = block.BlockPadding,
                        HeadingLevel = block.HeadingLevel,
                        Items = block.Items.Select(item => new EmailTemplateEditorBlockItemDocument
                        {
                            Id = item.Id,
                            Label = item.Label,
                            Url = item.Url
                        }).ToArray()
                    }).ToArray()
                }).ToArray()
            }).ToArray()
        };
    }
}
