namespace MjmlEditor.Domain.Templates;

public sealed class EmailTemplateEditorBlock
{
    public string Id { get; }

    public EmailTemplateEditorBlockType Type { get; }

    public string? TextContent { get; }

    public string? SecondaryText { get; }

    public string? ImageUrl { get; }

    public string? AltText { get; }

    public string? ActionLabel { get; }

    public string? ActionUrl { get; }

    public string? BackgroundColor { get; }

    public string? TextColor { get; }

    public EmailTemplateEditorAlignment? Alignment { get; }

    public string? FontFamily { get; }

    public string? FontWeight { get; }

    public int? FontSize { get; }

    public int? LineHeight { get; }

    public int? LetterSpacing { get; }

    public EmailTemplateEditorTextTransform? TextTransform { get; }

    public EmailTemplateEditorTextDecoration? TextDecoration { get; }

    public EmailTemplateEditorBlockLayout? Layout { get; }

    public EmailTemplateEditorBlockActionPlacement? ActionPlacement { get; }

    public int? Spacing { get; }

    public string? DividerColor { get; }

    public int? DividerThickness { get; }

    public string? BorderColor { get; }

    public int? BorderWidth { get; }

    public int? BorderRadius { get; }

    public int? WidthPercentage { get; }

    public int? BlockPadding { get; }

    public EmailTemplateEditorHeadingLevel? HeadingLevel { get; }

    public IReadOnlyList<EmailTemplateEditorBlockItem> Items { get; }

    public static EmailTemplateEditorBlock Create(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? secondaryText,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        string? fontFamily,
        string? fontWeight,
        int? fontSize,
        int? lineHeight,
        int? letterSpacing,
        EmailTemplateEditorTextTransform? textTransform,
        EmailTemplateEditorTextDecoration? textDecoration,
        EmailTemplateEditorBlockLayout? layout,
        EmailTemplateEditorBlockActionPlacement? actionPlacement,
        int? spacing,
        string? dividerColor,
        int? dividerThickness,
        string? borderColor,
        int? borderWidth,
        int? borderRadius,
        int? widthPercentage,
        int? blockPadding,
        EmailTemplateEditorHeadingLevel? headingLevel,
        IReadOnlyList<EmailTemplateEditorBlockItem>? items)
    {
        ValidateType(type);
        ValidateAlignment(alignment);
        ValidateTextTransform(textTransform);
        ValidateTextDecoration(textDecoration);
        ValidateLayout(layout);
        ValidateActionPlacement(actionPlacement);
        ValidateOptionalPositive(fontSize, nameof(fontSize));
        ValidateOptionalPositive(lineHeight, nameof(lineHeight));
        ValidateOptionalNonNegative(letterSpacing, nameof(letterSpacing));
        ValidateOptionalPositive(spacing, nameof(spacing));
        ValidateOptionalPositive(dividerThickness, nameof(dividerThickness));
        ValidateOptionalNonNegative(borderWidth, nameof(borderWidth));
        ValidateOptionalNonNegative(borderRadius, nameof(borderRadius));
        ValidateOptionalRange(widthPercentage, nameof(widthPercentage), 1, 100);
        ValidateOptionalNonNegative(blockPadding, nameof(blockPadding));

        if (headingLevel is not null && !Enum.IsDefined(headingLevel.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(headingLevel), headingLevel.Value, "Unsupported heading level.");
        }

        var normalizedTextContent = NormalizeOptional(textContent);
        var normalizedSecondaryText = NormalizeOptional(secondaryText);
        var normalizedImageUrl = NormalizeOptional(imageUrl);
        var normalizedAltText = NormalizeOptional(altText);
        var normalizedActionLabel = NormalizeOptional(actionLabel);
        var normalizedActionUrl = NormalizeOptional(actionUrl);
        var normalizedBackgroundColor = NormalizeOptional(backgroundColor);
        var normalizedTextColor = NormalizeOptional(textColor);
        var normalizedFontFamily = NormalizeOptional(fontFamily);
        var normalizedFontWeight = NormalizeOptional(fontWeight);
        var normalizedDividerColor = NormalizeOptional(dividerColor);
        var normalizedBorderColor = NormalizeOptional(borderColor);
        var normalizedItems = NormalizeItems(items);

        ValidateTypeSpecificFields(
            type,
            normalizedTextContent,
            normalizedImageUrl,
            normalizedActionLabel,
            normalizedActionUrl,
            spacing,
            normalizedItems);

        return new EmailTemplateEditorBlock(
            NormalizeRequired(id, nameof(id)),
            type,
            normalizedTextContent,
            normalizedSecondaryText,
            normalizedImageUrl,
            normalizedAltText,
            normalizedActionLabel,
            normalizedActionUrl,
            normalizedBackgroundColor,
            normalizedTextColor,
            alignment,
            normalizedFontFamily,
            normalizedFontWeight,
            fontSize,
            lineHeight,
            letterSpacing,
            textTransform,
            textDecoration,
            layout,
            actionPlacement,
            spacing,
            normalizedDividerColor,
            dividerThickness,
            normalizedBorderColor,
            borderWidth,
            borderRadius,
            widthPercentage,
            blockPadding,
            headingLevel,
            normalizedItems);
    }

    public static EmailTemplateEditorBlock Restore(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? secondaryText,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        string? fontFamily,
        string? fontWeight,
        int? fontSize,
        int? lineHeight,
        int? letterSpacing,
        EmailTemplateEditorTextTransform? textTransform,
        EmailTemplateEditorTextDecoration? textDecoration,
        EmailTemplateEditorBlockLayout? layout,
        EmailTemplateEditorBlockActionPlacement? actionPlacement,
        int? spacing,
        string? dividerColor,
        int? dividerThickness,
        string? borderColor,
        int? borderWidth,
        int? borderRadius,
        int? widthPercentage,
        int? blockPadding,
        EmailTemplateEditorHeadingLevel? headingLevel,
        IReadOnlyList<EmailTemplateEditorBlockItem>? items)
    {
        return Create(
            id,
            type,
            textContent,
            secondaryText,
            imageUrl,
            altText,
            actionLabel,
            actionUrl,
            backgroundColor,
            textColor,
            alignment,
            fontFamily,
            fontWeight,
            fontSize,
            lineHeight,
            letterSpacing,
            textTransform,
            textDecoration,
            layout,
            actionPlacement,
            spacing,
            dividerColor,
            dividerThickness,
            borderColor,
            borderWidth,
            borderRadius,
            widthPercentage,
            blockPadding,
            headingLevel,
            items);
    }

    public EmailTemplateEditorBlock Clone()
    {
        return Restore(
            Id,
            Type,
            TextContent,
            SecondaryText,
            ImageUrl,
            AltText,
            ActionLabel,
            ActionUrl,
            BackgroundColor,
            TextColor,
            Alignment,
            FontFamily,
            FontWeight,
            FontSize,
            LineHeight,
            LetterSpacing,
            TextTransform,
            TextDecoration,
            Layout,
            ActionPlacement,
            Spacing,
            DividerColor,
            DividerThickness,
            BorderColor,
            BorderWidth,
            BorderRadius,
            WidthPercentage,
            BlockPadding,
            HeadingLevel,
            Items.Select(item => item.Clone()).ToArray());
    }

    private EmailTemplateEditorBlock(
        string id,
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? secondaryText,
        string? imageUrl,
        string? altText,
        string? actionLabel,
        string? actionUrl,
        string? backgroundColor,
        string? textColor,
        EmailTemplateEditorAlignment? alignment,
        string? fontFamily,
        string? fontWeight,
        int? fontSize,
        int? lineHeight,
        int? letterSpacing,
        EmailTemplateEditorTextTransform? textTransform,
        EmailTemplateEditorTextDecoration? textDecoration,
        EmailTemplateEditorBlockLayout? layout,
        EmailTemplateEditorBlockActionPlacement? actionPlacement,
        int? spacing,
        string? dividerColor,
        int? dividerThickness,
        string? borderColor,
        int? borderWidth,
        int? borderRadius,
        int? widthPercentage,
        int? blockPadding,
        EmailTemplateEditorHeadingLevel? headingLevel,
        IReadOnlyList<EmailTemplateEditorBlockItem> items)
    {
        Id = id;
        Type = type;
        TextContent = textContent;
        SecondaryText = secondaryText;
        ImageUrl = imageUrl;
        AltText = altText;
        ActionLabel = actionLabel;
        ActionUrl = actionUrl;
        BackgroundColor = backgroundColor;
        TextColor = textColor;
        Alignment = alignment;
        FontFamily = fontFamily;
        FontWeight = fontWeight;
        FontSize = fontSize;
        LineHeight = lineHeight;
        LetterSpacing = letterSpacing;
        TextTransform = textTransform;
        TextDecoration = textDecoration;
        Layout = layout;
        ActionPlacement = actionPlacement;
        Spacing = spacing;
        DividerColor = dividerColor;
        DividerThickness = dividerThickness;
        BorderColor = borderColor;
        BorderWidth = borderWidth;
        BorderRadius = borderRadius;
        WidthPercentage = widthPercentage;
        BlockPadding = blockPadding;
        HeadingLevel = headingLevel;
        Items = items;
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

    private static void ValidateTextTransform(EmailTemplateEditorTextTransform? textTransform)
    {
        if (textTransform is not null && !Enum.IsDefined(textTransform.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(textTransform), textTransform, "Unsupported editor text transform.");
        }
    }

    private static void ValidateTextDecoration(EmailTemplateEditorTextDecoration? textDecoration)
    {
        if (textDecoration is not null && !Enum.IsDefined(textDecoration.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(textDecoration), textDecoration, "Unsupported editor text decoration.");
        }
    }

    private static void ValidateLayout(EmailTemplateEditorBlockLayout? layout)
    {
        if (layout is not null && !Enum.IsDefined(layout.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(layout), layout, "Unsupported editor block layout.");
        }
    }

    private static void ValidateActionPlacement(EmailTemplateEditorBlockActionPlacement? actionPlacement)
    {
        if (actionPlacement is not null && !Enum.IsDefined(actionPlacement.Value))
        {
            throw new ArgumentOutOfRangeException(nameof(actionPlacement), actionPlacement, "Unsupported editor action placement.");
        }
    }

    private static void ValidateOptionalPositive(int? value, string paramName)
    {
        if (value is not null && value <= 0)
        {
            throw new ArgumentOutOfRangeException(paramName, value, $"{paramName} must be positive when provided.");
        }
    }

    private static void ValidateOptionalNonNegative(int? value, string paramName)
    {
        if (value is not null && value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, value, $"{paramName} must be non-negative when provided.");
        }
    }

    private static void ValidateOptionalRange(int? value, string paramName, int min, int max)
    {
        if (value is not null && (value < min || value > max))
        {
            throw new ArgumentOutOfRangeException(paramName, value, $"{paramName} must be between {min} and {max} when provided.");
        }
    }

    private static void ValidateTypeSpecificFields(
        EmailTemplateEditorBlockType type,
        string? textContent,
        string? imageUrl,
        string? actionLabel,
        string? actionUrl,
        int? spacing,
        IReadOnlyList<EmailTemplateEditorBlockItem> items)
    {
        switch (type)
        {
            case EmailTemplateEditorBlockType.Hero:
            case EmailTemplateEditorBlockType.Text:
            case EmailTemplateEditorBlockType.Footer:
            case EmailTemplateEditorBlockType.Badge:
            case EmailTemplateEditorBlockType.Quote:
                if (string.IsNullOrWhiteSpace(textContent))
                {
                    throw new ArgumentException("TextContent is required for this block type.", nameof(textContent));
                }

                break;

            case EmailTemplateEditorBlockType.Image:
            case EmailTemplateEditorBlockType.Logo:
                if (string.IsNullOrWhiteSpace(imageUrl))
                {
                    throw new ArgumentException("ImageUrl is required for this block type.", nameof(imageUrl));
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

            case EmailTemplateEditorBlockType.SocialLinks:
            case EmailTemplateEditorBlockType.LinkList:
                if (items.Count == 0)
                {
                    throw new ArgumentException("At least one item is required for this block type.", nameof(items));
                }

                break;
        }
    }

    private static IReadOnlyList<EmailTemplateEditorBlockItem> NormalizeItems(IReadOnlyList<EmailTemplateEditorBlockItem>? items)
    {
        if (items is null || items.Count == 0)
        {
            return [];
        }

        return items
            .Select(item => item.Clone())
            .ToArray();
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
