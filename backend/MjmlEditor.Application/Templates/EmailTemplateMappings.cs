using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public static class EmailTemplateMappings
{
    public static EmailTemplateDto ToDto(this EmailTemplate template)
    {
        ArgumentNullException.ThrowIfNull(template);

        return new EmailTemplateDto(
            template.Id,
            template.Name,
            template.Subject,
            template.MjmlBody,
            template.Status,
            template.CreatedAtUtc,
            template.UpdatedAtUtc,
            template.CurrentRevisionNumber,
            template.PublishedRevisionId,
            template.EditorDocument?.ToDto());
    }

    public static EmailTemplateSummaryDto ToSummaryDto(this EmailTemplate template)
    {
        ArgumentNullException.ThrowIfNull(template);

        return new EmailTemplateSummaryDto(
            template.Id,
            template.Name,
            template.Subject,
            template.Status,
            template.UpdatedAtUtc);
    }

    public static EmailTemplateRevisionDto ToDto(this EmailTemplateRevision revision, string? publishedRevisionId)
    {
        ArgumentNullException.ThrowIfNull(revision);

        return new EmailTemplateRevisionDto(
            revision.Id,
            revision.RevisionNumber,
            revision.Name,
            revision.Subject,
            revision.Status,
            revision.EventType,
            revision.ActorUserId,
            revision.CreatedAtUtc,
            string.Equals(revision.Id, publishedRevisionId, StringComparison.Ordinal));
    }

    public static EmailTemplateEditorDocumentDto ToDto(this EmailTemplateEditorDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return new EmailTemplateEditorDocumentDto
        {
            Version = document.Version,
            Sections = document.Sections.Select(section => new EmailTemplateEditorSectionDto
            {
                Id = section.Id,
                BackgroundColor = section.BackgroundColor,
                Padding = section.Padding,
                Columns = section.Columns.Select(column => new EmailTemplateEditorColumnDto
                {
                    Id = column.Id,
                    WidthPercentage = column.WidthPercentage,
                    Blocks = column.Blocks.Select(block => new EmailTemplateEditorBlockDto
                    {
                        Id = block.Id,
                        Type = block.Type,
                        TextContent = block.TextContent,
                        ImageUrl = block.ImageUrl,
                        AltText = block.AltText,
                        ActionLabel = block.ActionLabel,
                        ActionUrl = block.ActionUrl,
                        BackgroundColor = block.BackgroundColor,
                        TextColor = block.TextColor,
                        Alignment = block.Alignment,
                        FontSize = block.FontSize,
                        Spacing = block.Spacing,
                        DividerColor = block.DividerColor,
                        DividerThickness = block.DividerThickness
                    }).ToArray()
                }).ToArray()
            }).ToArray()
        };
    }

    public static EmailTemplateEditorDocument ToDomain(this EmailTemplateEditorDocumentDto document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return EmailTemplateEditorDocument.Create(
            document.Version,
            document.Sections.Select(section => EmailTemplateEditorSection.Create(
                section.Id,
                section.BackgroundColor,
                section.Padding,
                section.Columns.Select(column => EmailTemplateEditorColumn.Create(
                    column.Id,
                    column.WidthPercentage,
                    column.Blocks.Select(block => EmailTemplateEditorBlock.Create(
                        block.Id,
                        block.Type,
                        block.TextContent,
                        block.ImageUrl,
                        block.AltText,
                        block.ActionLabel,
                        block.ActionUrl,
                        block.BackgroundColor,
                        block.TextColor,
                        block.Alignment,
                        block.FontSize,
                        block.Spacing,
                        block.DividerColor,
                        block.DividerThickness)).ToArray())).ToArray())).ToArray());
    }
}
