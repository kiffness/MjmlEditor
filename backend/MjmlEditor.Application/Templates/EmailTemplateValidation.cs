using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

public static class EmailTemplateValidation
{
    public const int NameMaxLength = 120;
    public const int SubjectMaxLength = 200;
    public const int MjmlBodyMaxLength = 100_000;

    public static ValidationResult ValidateCreate(CreateEmailTemplateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return ValidateCore(request.Name, request.Subject, request.MjmlBody, request.EditorDocument);
    }

    public static ValidationResult ValidateUpdate(UpdateEmailTemplateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var errors = ValidateCore(request.Name, request.Subject, request.MjmlBody, request.EditorDocument).Errors.ToList();

        if (!Enum.IsDefined(request.Status))
        {
            errors.Add(new ValidationError(nameof(request.Status), "A supported template status is required."));
        }

        return errors.Count == 0 ? ValidationResult.Success : new ValidationResult(errors);
    }

    private static ValidationResult ValidateCore(
        string name,
        string subject,
        string mjmlBody,
        EmailTemplateEditorDocumentDto? editorDocument)
    {
        List<ValidationError> errors = [];

        ValidateRequiredText(errors, nameof(CreateEmailTemplateRequest.Name), name, NameMaxLength);
        ValidateRequiredText(errors, nameof(CreateEmailTemplateRequest.Subject), subject, SubjectMaxLength);
        ValidateMjmlBody(errors, mjmlBody, editorDocument is not null);
        ValidateEditorDocument(errors, editorDocument);

        return errors.Count == 0 ? ValidationResult.Success : new ValidationResult(errors);
    }

    private static void ValidateRequiredText(
        ICollection<ValidationError> errors,
        string field,
        string value,
        int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add(new ValidationError(field, $"{field} is required."));
            return;
        }

        if (value.Trim().Length > maxLength)
        {
            errors.Add(new ValidationError(field, $"{field} must be {maxLength} characters or fewer."));
        }
    }

    private static void ValidateMjmlBody(
        ICollection<ValidationError> errors,
        string mjmlBody,
        bool allowEmptyWhenEditorDocumentPresent)
    {
        const string mjmlRoot = "<mjml";

        if (string.IsNullOrWhiteSpace(mjmlBody))
        {
            if (!allowEmptyWhenEditorDocumentPresent)
            {
                errors.Add(new ValidationError(nameof(CreateEmailTemplateRequest.MjmlBody), "MjmlBody is required."));
            }

            return;
        }

        var normalizedBody = mjmlBody.Trim();

        if (normalizedBody.Length > MjmlBodyMaxLength)
        {
            errors.Add(new ValidationError(
                nameof(CreateEmailTemplateRequest.MjmlBody),
                $"MjmlBody must be {MjmlBodyMaxLength} characters or fewer."));
        }

        if (!normalizedBody.Contains(mjmlRoot, StringComparison.OrdinalIgnoreCase))
        {
            errors.Add(new ValidationError(
                nameof(CreateEmailTemplateRequest.MjmlBody),
                "MjmlBody must contain an <mjml> root element."));
        }
    }

    private static void ValidateEditorDocument(
        ICollection<ValidationError> errors,
        EmailTemplateEditorDocumentDto? editorDocument)
    {
        if (editorDocument is null)
        {
            return;
        }

        if (editorDocument.Version <= 0)
        {
            errors.Add(new ValidationError("EditorDocument.Version", "EditorDocument.Version must be positive."));
        }

        if (editorDocument.Sections.Count == 0)
        {
            errors.Add(new ValidationError("EditorDocument.Sections", "EditorDocument must contain at least one section."));
            return;
        }

        for (var sectionIndex = 0; sectionIndex < editorDocument.Sections.Count; sectionIndex++)
        {
            var section = editorDocument.Sections[sectionIndex];

            if (string.IsNullOrWhiteSpace(section.Id))
            {
                errors.Add(new ValidationError($"EditorDocument.Sections[{sectionIndex}].Id", "Section id is required."));
            }

            if (section.Padding is not null && section.Padding <= 0)
            {
                errors.Add(new ValidationError($"EditorDocument.Sections[{sectionIndex}].Padding", "Section padding must be positive when provided."));
            }

            if (section.Columns.Count == 0)
            {
                errors.Add(new ValidationError($"EditorDocument.Sections[{sectionIndex}].Columns", "Each section must contain at least one column."));
                continue;
            }

            for (var columnIndex = 0; columnIndex < section.Columns.Count; columnIndex++)
            {
                var column = section.Columns[columnIndex];

                if (string.IsNullOrWhiteSpace(column.Id))
                {
                    errors.Add(new ValidationError($"EditorDocument.Sections[{sectionIndex}].Columns[{columnIndex}].Id", "Column id is required."));
                }

                if (column.WidthPercentage <= 0 || column.WidthPercentage > 100)
                {
                    errors.Add(new ValidationError(
                        $"EditorDocument.Sections[{sectionIndex}].Columns[{columnIndex}].WidthPercentage",
                        "Column widthPercentage must be between 1 and 100."));
                }

                if (column.VerticalAlignment is not null && !Enum.IsDefined(column.VerticalAlignment.Value))
                {
                    errors.Add(new ValidationError(
                        $"EditorDocument.Sections[{sectionIndex}].Columns[{columnIndex}].VerticalAlignment",
                        "A supported column vertical alignment is required."));
                }

                for (var blockIndex = 0; blockIndex < column.Blocks.Count; blockIndex++)
                {
                    var block = column.Blocks[blockIndex];
                    var fieldPrefix = $"EditorDocument.Sections[{sectionIndex}].Columns[{columnIndex}].Blocks[{blockIndex}]";

                    if (string.IsNullOrWhiteSpace(block.Id))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.Id", "Block id is required."));
                    }

                    if (!Enum.IsDefined(block.Type))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.Type", "A supported editor block type is required."));
                    }

                    if (block.Alignment is not null && !Enum.IsDefined(block.Alignment.Value))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.Alignment", "A supported editor alignment is required."));
                    }

                    if (block.TextTransform is not null && !Enum.IsDefined(block.TextTransform.Value))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.TextTransform", "A supported text transform is required."));
                    }

                    if (block.TextDecoration is not null && !Enum.IsDefined(block.TextDecoration.Value))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.TextDecoration", "A supported text decoration is required."));
                    }

                    if (block.FontSize is not null && block.FontSize <= 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.FontSize", "FontSize must be positive when provided."));
                    }

                    if (block.LineHeight is not null && block.LineHeight <= 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.LineHeight", "LineHeight must be positive when provided."));
                    }

                    if (block.LetterSpacing is not null && block.LetterSpacing < 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.LetterSpacing", "LetterSpacing must be zero or greater when provided."));
                    }

                    if (block.Spacing is not null && block.Spacing <= 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.Spacing", "Spacing must be positive when provided."));
                    }

                    if (block.DividerThickness is not null && block.DividerThickness <= 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.DividerThickness", "DividerThickness must be positive when provided."));
                    }

                    if (block.BorderWidth is not null && block.BorderWidth < 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.BorderWidth", "BorderWidth must be zero or greater when provided."));
                    }

                    if (block.BorderRadius is not null && block.BorderRadius < 0)
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.BorderRadius", "BorderRadius must be zero or greater when provided."));
                    }

                    if (block.WidthPercentage is not null && (block.WidthPercentage <= 0 || block.WidthPercentage > 100))
                    {
                        errors.Add(new ValidationError($"{fieldPrefix}.WidthPercentage", "WidthPercentage must be between 1 and 100 when provided."));
                    }

                    var items = block.Items ?? [];

                    for (var itemIndex = 0; itemIndex < items.Count; itemIndex++)
                    {
                        var item = items[itemIndex];
                        var itemPrefix = $"{fieldPrefix}.Items[{itemIndex}]";

                        if (string.IsNullOrWhiteSpace(item.Id))
                        {
                            errors.Add(new ValidationError($"{itemPrefix}.Id", "Item id is required."));
                        }

                        if (string.IsNullOrWhiteSpace(item.Label))
                        {
                            errors.Add(new ValidationError($"{itemPrefix}.Label", "Item label is required."));
                        }

                        if (string.IsNullOrWhiteSpace(item.Url))
                        {
                            errors.Add(new ValidationError($"{itemPrefix}.Url", "Item URL is required."));
                        }
                    }

                    switch (block.Type)
                    {
                        case EmailTemplateEditorBlockType.Hero:
                        case EmailTemplateEditorBlockType.Text:
                        case EmailTemplateEditorBlockType.Footer:
                        case EmailTemplateEditorBlockType.Badge:
                        case EmailTemplateEditorBlockType.Quote:
                        case EmailTemplateEditorBlockType.FeatureCard:
                        case EmailTemplateEditorBlockType.PromoBanner:
                            if (string.IsNullOrWhiteSpace(block.TextContent))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.TextContent", "TextContent is required for this block type."));
                            }

                            break;

                        case EmailTemplateEditorBlockType.PropertyCard:
                        case EmailTemplateEditorBlockType.IconText:
                            if (string.IsNullOrWhiteSpace(block.TextContent))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.TextContent", "TextContent is required for this block type."));
                            }

                            if (string.IsNullOrWhiteSpace(block.ImageUrl))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.ImageUrl", "ImageUrl is required for this block type."));
                            }

                            break;

                        case EmailTemplateEditorBlockType.Image:
                        case EmailTemplateEditorBlockType.Logo:
                            if (string.IsNullOrWhiteSpace(block.ImageUrl))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.ImageUrl", "ImageUrl is required for this block type."));
                            }

                            break;

                        case EmailTemplateEditorBlockType.Button:
                            if (string.IsNullOrWhiteSpace(block.ActionLabel))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.ActionLabel", "ActionLabel is required for button blocks."));
                            }

                            if (string.IsNullOrWhiteSpace(block.ActionUrl))
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.ActionUrl", "ActionUrl is required for button blocks."));
                            }

                            break;

                        case EmailTemplateEditorBlockType.Spacer:
                            if (block.Spacing is null)
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.Spacing", "Spacing is required for spacer blocks."));
                            }

                            break;

                        case EmailTemplateEditorBlockType.SocialLinks:
                        case EmailTemplateEditorBlockType.LinkList:
                            if (items.Count == 0)
                            {
                                errors.Add(new ValidationError($"{fieldPrefix}.Items", "At least one item is required for this block type."));
                            }

                            break;
                    }
                }
            }
        }
    }
}
