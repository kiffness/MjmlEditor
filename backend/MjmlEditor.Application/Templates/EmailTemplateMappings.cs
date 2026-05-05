using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public static class EmailTemplateMappings
{
    /// <summary>
    /// Converts the aggregate root into the API shape returned to the frontend editor.
    /// </summary>
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

    /// <summary>
    /// Converts a template into the smaller library/list view projection.
    /// </summary>
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

    /// <summary>
    /// Converts a revision into the DTO used by the revision history UI.
    /// </summary>
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

    /// <summary>
    /// Converts the structured editor document from the domain model into the API DTO graph.
    /// </summary>
    public static EmailTemplateEditorDocumentDto ToDto(this EmailTemplateEditorDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return new EmailTemplateEditorDocumentDto
        {
            Version = document.Version,
            Sections = document.Sections.Select(s => s.ToDto()).ToArray()
        };
    }

    /// <summary>
    /// Converts a single section from the domain model into its API DTO.
    /// </summary>
    public static EmailTemplateEditorSectionDto ToDto(this EmailTemplateEditorSection section)
    {
        ArgumentNullException.ThrowIfNull(section);

        return new EmailTemplateEditorSectionDto
        {
            Id = section.Id,
            BackgroundColor = section.BackgroundColor,
            Padding = section.Padding,
            SavedSectionId = section.SavedSectionId,
            Columns = section.Columns.Select(column => new EmailTemplateEditorColumnDto
            {
                Id = column.Id,
                WidthPercentage = column.WidthPercentage,
                BackgroundColor = column.BackgroundColor,
                Padding = column.Padding,
                VerticalAlignment = column.VerticalAlignment,
                Blocks = column.Blocks.Select(block => new EmailTemplateEditorBlockDto
                {
                    Id = block.Id,
                    Type = block.Type,
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
                    Items = block.Items.Select(item => new EmailTemplateEditorBlockItemDto
                    {
                        Id = item.Id,
                        Label = item.Label,
                        Url = item.Url
                    }).ToArray()
                }).ToArray()
            }).ToArray()
        };
    }

    /// <summary>
    /// Converts the API editor document into the validated domain model used for persistence and MJML generation.
    /// </summary>
    public static EmailTemplateEditorDocument ToDomain(this EmailTemplateEditorDocumentDto document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return EmailTemplateEditorDocument.Create(
            document.Version,
            document.Sections.Select(s => s.ToDomain()).ToArray());
    }

    /// <summary>
    /// Converts a single section DTO into the validated domain model.
    /// </summary>
    public static EmailTemplateEditorSection ToDomain(this EmailTemplateEditorSectionDto section)
    {
        ArgumentNullException.ThrowIfNull(section);

        return EmailTemplateEditorSection.Create(
            section.Id,
            section.BackgroundColor,
            section.Padding,
            section.SavedSectionId,
            section.Columns.Select(column => EmailTemplateEditorColumn.Create(
                column.Id,
                column.WidthPercentage,
                column.BackgroundColor,
                column.Padding,
                column.VerticalAlignment,
                column.Blocks.Select(block => EmailTemplateEditorBlock.Create(
                    block.Id,
                    block.Type,
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
                    block.Items?.Select(item => EmailTemplateEditorBlockItem.Create(
                        item.Id,
                        item.Label,
                        item.Url)).ToArray() ?? [])).ToArray())).ToArray());
    }
}
