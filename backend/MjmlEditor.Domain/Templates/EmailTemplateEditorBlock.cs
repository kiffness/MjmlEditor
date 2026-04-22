namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorBlock
{
    public string Id { get; }

    public EmailTemplateEditorBlockType Type { get; }

    public string? TextContent { get; }

    public string? ImageUrl { get; }

    public string? AltText { get; }

    public string? ActionLabel { get; }

    public string? ActionUrl { get; }

    public string? BackgroundColor { get; }

    public string? TextColor { get; }

    public EmailTemplateEditorAlignment? Alignment { get; }

    public int? FontSize { get; }

    public int? Spacing { get; }

    public string? DividerColor { get; }

    public int? DividerThickness { get; }

    public static EmailTemplateEditorBlock Create(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        int? fontSize,
        int? spacing,
        string? dividerColor,
        int? dividerThickness)
    {
        ValidateType(type);
        ValidateAlignment(alignment);
        ValidateOptionalPositive(fontSize, nameof(fontSize));
        ValidateOptionalPositive(spacing, nameof(spacing));
        ValidateOptionalPositive(dividerThickness, nameof(dividerThickness));

        var normalizedTextContent = NormalizeOptional(textContent);
        var normalizedImageUrl = NormalizeOptional(imageUrl);
        var normalizedAltText = NormalizeOptional(altText);
        var normalizedActionLabel = NormalizeOptional(actionLabel);
        var normalizedActionUrl = NormalizeOptional(actionUrl);
        var normalizedBackgroundColor = NormalizeOptional(backgroundColor);
        var normalizedTextColor = NormalizeOptional(textColor);
        var normalizedDividerColor = NormalizeOptional(dividerColor);

        ValidateTypeSpecificFields(
            type,
            normalizedTextContent,
            normalizedImageUrl,
            normalizedActionLabel,
            normalizedActionUrl,
            spacing);

        return new EmailTemplateEditorBlock(
            NormalizeRequired(id, nameof(id)),
            type,
            normalizedTextContent,
            normalizedImageUrl,
            normalizedAltText,
            normalizedActionLabel,
            normalizedActionUrl,
            normalizedBackgroundColor,
            normalizedTextColor,
            alignment,
            fontSize,
            spacing,
            normalizedDividerColor,
            dividerThickness);
    }

    public static EmailTemplateEditorBlock Restore(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        int? fontSize,
        int? spacing,
        string? dividerColor,
        int? dividerThickness)
    {
        return Create(
            id,
            type,
            textContent,
            imageUrl,
            altText,
            actionLabel,
            actionUrl,
            backgroundColor,
            textColor,
            alignment,
            fontSize,
            spacing,
            dividerColor,
            dividerThickness);
    }

    public EmailTemplateEditorBlock Clone()
    {
        return Restore(
            Id,
            Type,
            TextContent,
            ImageUrl,
            AltText,
            ActionLabel,
            ActionUrl,
            BackgroundColor,
            TextColor,
            Alignment,
            FontSize,
            Spacing,
            DividerColor,
            DividerThickness);
    }

    private EmailTemplateEditorBlock(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        int? fontSize,
        int? spacing,
        string? dividerColor,
        int? dividerThickness)
    {
        Id = id;
        Type = type;
        TextContent = textContent;
        ImageUrl = imageUrl;
        AltText = altText;
        ActionLabel = actionLabel;
        ActionUrl = actionUrl;
        BackgroundColor = backgroundColor;
        TextColor = textColor;
        Alignment = alignment;
        FontSize = fontSize;
        Spacing = spacing;
        DividerColor = dividerColor;
        DividerThickness = dividerThickness;
    }

    private static void ValidateType(EmailTemplateEditorBlockType type)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), type, "Unsupported editor block type.");
        }
    }

    private static void ValidateAlignment(EmailTemplateEditorAlignment? alignment)
    {
        if (alignment is not null && !Enum.IsDefined(alignment.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(alignment), alignment, "Unsupported editor alignment.");
        }
    }

    private static void ValidateOptionalPositive(int? value, string paramName)
    {
        if (value is not null && value <= 0)
        {
            throw new ArgumentOutOfRangeException(paramName, value, $"{paramName} must be positive when provided.");
        }
    }

    private static void ValidateTypeSpecificFields(
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? imageUrl,
        string? actionLabel,
        string? actionUrl,
        int? spacing)
    {
        switch (type)
        {
            case EmailTemplateEditorBlockType.Hero:
            case EmailTemplateEditorBlockType.Text:
                if (string.IsNullOrWhiteSpace(textContent))
                {
                    throw new ArgumentException("TextContent is required for hero and text blocks.", nameof(textContent));
                }

                break;

            case EmailTemplateEditorBlockType.Image:
                if (string.IsNullOrWhiteSpace(imageUrl))
                {
                    throw new ArgumentException("ImageUrl is required for image blocks.", nameof(imageUrl));
                }

                break;

            case EmailTemplateEditorBlockType.Button:
                if (string.IsNullOrWhiteSpace(actionLabel))
                {
                    throw new ArgumentException("ActionLabel is required for button blocks.", nameof(actionLabel));
                }

                if (string.IsNullOrWhiteSpace(actionUrl))
                {
                    throw new ArgumentException("ActionUrl is required for button blocks.", nameof(actionUrl));
                }

                break;

            case EmailTemplateEditorBlockType.Spacer:
                if (spacing is null)
                {
                    throw new ArgumentException("Spacing is required for spacer blocks.", nameof(spacing));
                }

                break;
        }
    }

    private static string NormalizeRequired(string value, string paramName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value is required.", paramName);
        }

        return value.Trim();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
