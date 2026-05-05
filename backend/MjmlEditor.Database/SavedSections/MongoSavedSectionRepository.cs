using MjmlEditor.Database.Configuration;
using MjmlEditor.Database.Templates;
using MjmlEditor.Domain.SavedSections;
using MjmlEditor.Domain.Templates;
using MongoDB.Driver;

namespace MjmlEditor.Database.SavedSections;

internal sealed class MongoSavedSectionRepository(
    IMongoDatabase database,
    MongoDbOptions options) : ISavedSectionRepository
{
    private readonly IMongoCollection<SavedSectionDocument> _collection =
        database.GetCollection<SavedSectionDocument>(options.SavedSectionsCollectionName);

    public async Task<SavedSection?> GetByIdAsync(string tenantId, string id, CancellationToken cancellationToken)
    {
        var doc = await _collection
            .Find(x => x.TenantId == tenantId && x.Id == id)
            .FirstOrDefaultAsync(cancellationToken);

        return doc is null ? null : MapToDomain(doc);
    }

    public async Task<IReadOnlyList<SavedSection>> ListByTenantIdAsync(string tenantId, CancellationToken cancellationToken)
    {
        var docs = await _collection
            .Find(x => x.TenantId == tenantId)
            .SortBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return docs.Select(MapToDomain).ToArray();
    }

    public Task AddAsync(SavedSection savedSection, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(savedSection);
        return _collection.InsertOneAsync(MapToDocument(savedSection), cancellationToken: cancellationToken);
    }

    public Task UpdateAsync(SavedSection savedSection, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(savedSection);
        return _collection.ReplaceOneAsync(
            x => x.TenantId == savedSection.TenantId && x.Id == savedSection.Id,
            MapToDocument(savedSection),
            new ReplaceOptions { IsUpsert = false },
            cancellationToken);
    }

    public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken cancellationToken)
    {
        var result = await _collection.DeleteOneAsync(
            x => x.TenantId == tenantId && x.Id == id,
            cancellationToken);

        return result.DeletedCount > 0;
    }

    private static SavedSection MapToDomain(SavedSectionDocument doc)
    {
        return SavedSection.Restore(
            doc.Id,
            doc.TenantId,
            doc.Name,
            MapSectionToDomain(doc.SectionData),
            DateTime.SpecifyKind(doc.CreatedAtUtc, DateTimeKind.Utc),
            DateTime.SpecifyKind(doc.UpdatedAtUtc, DateTimeKind.Utc));
    }

    private static SavedSectionDocument MapToDocument(SavedSection savedSection)
    {
        return new SavedSectionDocument
        {
            Id = savedSection.Id,
            TenantId = savedSection.TenantId,
            Name = savedSection.Name,
            SectionData = MapSectionToDocument(savedSection.SectionData),
            CreatedAtUtc = savedSection.CreatedAtUtc.UtcDateTime,
            UpdatedAtUtc = savedSection.UpdatedAtUtc.UtcDateTime
        };
    }

    // Section mapping mirrors MongoEmailTemplateRepository but is kept here to avoid coupling repositories.
    private static EmailTemplateEditorSection MapSectionToDomain(EmailTemplateEditorSectionDocument section)
    {
        return EmailTemplateEditorSection.Restore(
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
                            item.Url)).ToArray() ?? [])).ToArray())).ToArray());
    }

    private static EmailTemplateEditorSectionDocument MapSectionToDocument(EmailTemplateEditorSection section)
    {
        return new EmailTemplateEditorSectionDocument
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
        };
    }
}
