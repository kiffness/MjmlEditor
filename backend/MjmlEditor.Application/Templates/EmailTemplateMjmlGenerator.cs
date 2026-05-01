using System.Net;
using System.Text;
using Ganss.Xss;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

internal sealed class EmailTemplateMjmlGenerator : IEmailTemplateMjmlGenerator
{
    /// <summary>
    /// Generates canonical MJML for the structured editor document.
    /// </summary>
    public string Generate(EmailTemplateEditorDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        var builder = new StringBuilder();
        builder.AppendLine("<mjml>");
        builder.AppendLine("  <mj-body background-color=\"#f5f7fb\">");

        foreach (var section in document.Sections)
        {
            builder.Append("    <mj-section");

            if (!string.IsNullOrWhiteSpace(section.BackgroundColor))
            {
                builder.Append($" background-color=\"{EncodeAttribute(section.BackgroundColor)}\"");
            }

            if (section.Padding is not null)
            {
                builder.Append($" padding=\"{section.Padding.Value}px\"");
            }

            builder.AppendLine(">");

            foreach (var column in section.Columns)
            {
                builder.Append("      <mj-column");
                builder.Append($" width=\"{column.WidthPercentage}%\"");

                if (!string.IsNullOrWhiteSpace(column.BackgroundColor))
                {
                    builder.Append($" background-color=\"{EncodeAttribute(column.BackgroundColor)}\"");
                }

                if (column.Padding is not null)
                {
                    builder.Append($" padding=\"{column.Padding.Value}px\"");
                }

                if (column.VerticalAlignment is not null)
                {
                    builder.Append($" vertical-align=\"{ToMjmlVerticalAlignment(column.VerticalAlignment.Value)}\"");
                }

                builder.AppendLine(">");

                foreach (var block in column.Blocks)
                {
                    builder.AppendLine(RenderBlock(block));
                }

                builder.AppendLine("      </mj-column>");
            }

            builder.AppendLine("    </mj-section>");
        }

        builder.AppendLine("  </mj-body>");
        builder.Append("</mjml>");

        return builder.ToString();
    }

    private static string RenderBlock(EmailTemplateEditorBlock block)
    {
        return block.Type switch
        {
            EmailTemplateEditorBlockType.Hero => RenderTextBlock(block, 24, isHero: true),
            EmailTemplateEditorBlockType.Text => RenderTextBlock(block, 16, isHero: false),
            EmailTemplateEditorBlockType.Image => RenderImageBlock(block),
            EmailTemplateEditorBlockType.Button => RenderButtonBlock(block),
            EmailTemplateEditorBlockType.Spacer => RenderSpacerBlock(block),
            EmailTemplateEditorBlockType.Divider => RenderDividerBlock(block),
            EmailTemplateEditorBlockType.Logo => RenderLogoBlock(block),
            EmailTemplateEditorBlockType.SocialLinks => RenderLinksBlock(block, inlineByDefault: true, defaultAlignment: EmailTemplateEditorAlignment.Center),
            EmailTemplateEditorBlockType.Footer => RenderFooterBlock(block),
            EmailTemplateEditorBlockType.LinkList => RenderLinksBlock(block, inlineByDefault: false, defaultAlignment: EmailTemplateEditorAlignment.Left),
            EmailTemplateEditorBlockType.Badge => RenderBadgeBlock(block),
            EmailTemplateEditorBlockType.Quote => RenderQuoteBlock(block),
            _ => throw new ArgumentOutOfRangeException(nameof(block), block.Type, "Unsupported editor block type.")
        };
    }

    private static string RenderTextBlock(EmailTemplateEditorBlock block, int defaultFontSize, bool isHero)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-text");
        AppendTextStyleAttributes(
            builder,
            block,
            block.FontSize ?? defaultFontSize,
            block.TextColor ?? (isHero ? "#1f2937" : "#4b5563"),
            isHero ? "700" : null);
        AppendBoxAttributes(builder, block);
        AppendPaddingAttribute(builder, block);

        builder.Append(">");
        builder.Append(SanitizeBlock(block.TextContent));
        builder.Append("</mj-text>");
        return builder.ToString();
    }

    private static string RenderImageBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-image");
        builder.Append($" src=\"{EncodeAttribute(block.ImageUrl ?? string.Empty)}\"");

        if (!string.IsNullOrWhiteSpace(block.AltText))
        {
            builder.Append($" alt=\"{EncodeAttribute(block.AltText)}\"");
        }

        builder.Append($" align=\"{ToMjmlAlignment(block.Alignment)}\"");
        AppendWidthAttribute(builder, block.WidthPercentage);
        AppendBoxAttributes(builder, block);
        AppendPaddingAttribute(builder, block);
        builder.Append(" />");
        return builder.ToString();
    }

    private static string RenderLogoBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-image");
        builder.Append($" src=\"{EncodeAttribute(block.ImageUrl ?? string.Empty)}\"");
        builder.Append(block.WidthPercentage is not null ? $" width=\"{block.WidthPercentage.Value}%\"" : " width=\"140px\"");

        if (!string.IsNullOrWhiteSpace(block.AltText))
        {
            builder.Append($" alt=\"{EncodeAttribute(block.AltText)}\"");
        }

        if (!string.IsNullOrWhiteSpace(block.ActionUrl))
        {
            builder.Append($" href=\"{EncodeAttribute(block.ActionUrl)}\"");
        }

        builder.Append($" align=\"{ToMjmlAlignment(block.Alignment ?? EmailTemplateEditorAlignment.Left)}\"");
        builder.Append($" padding=\"{block.BlockPadding?.ToString() ?? "0"}px\"");
        AppendBoxAttributes(builder, block);
        builder.Append(" />");
        return builder.ToString();
    }

    private static string RenderButtonBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-button");
        builder.Append($" href=\"{EncodeAttribute(block.ActionUrl ?? string.Empty)}\"");
        builder.Append($" background-color=\"{EncodeAttribute(block.BackgroundColor ?? "#2563eb")}\"");
        builder.Append($" color=\"{EncodeAttribute(block.TextColor ?? "#ffffff")}\"");
        builder.Append($" align=\"{ToMjmlAlignment(block.Alignment)}\"");
        AppendTextStyleAttributes(builder, block, null, null, "600", includeAlignment: false);
        AppendBorderAttributes(builder, block);
        if (block.BorderRadius is not null)
        {
            builder.Append($" border-radius=\"{block.BorderRadius.Value}px\"");
        }
        AppendWidthAttribute(builder, block.WidthPercentage);
        AppendPaddingAttribute(builder, block);
        builder.Append(">");
        builder.Append(EncodeText(block.ActionLabel ?? string.Empty));
        builder.Append("</mj-button>");
        return builder.ToString();
    }

    private static string RenderSpacerBlock(EmailTemplateEditorBlock block)
    {
        return $"        <mj-spacer height=\"{block.Spacing ?? 24}px\" />";
    }

    private static string RenderDividerBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-divider");
        builder.Append($" border-color=\"{EncodeAttribute(block.DividerColor ?? "#d1d5db")}\"");
        builder.Append($" border-width=\"{block.DividerThickness ?? 1}px\"");
        AppendWidthAttribute(builder, block.WidthPercentage);
        AppendPaddingAttribute(builder, block);
        builder.Append(" />");
        return builder.ToString();
    }

    private static string RenderFooterBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        var alignment = ToMjmlAlignment(block.Alignment ?? EmailTemplateEditorAlignment.Center);
        var textColor = EncodeAttribute(block.TextColor ?? "#64748b");
        var fontSize = block.FontSize ?? 12;

        builder.Append("        <mj-text");
        AppendTextStyleAttributes(builder, block, fontSize, block.TextColor ?? "#64748b", null, includeAlignment: false);
        AppendBoxAttributes(builder, block);
        AppendPaddingAttribute(builder, block);
        builder.Append($" align=\"{alignment}\"");
        builder.Append($">{SanitizeBlock(block.TextContent)}</mj-text>");
        builder.AppendLine();

        if (!string.IsNullOrWhiteSpace(block.SecondaryText))
        {
            builder.Append("        <mj-text");
            builder.Append($" align=\"{alignment}\"");
            builder.Append($" font-size=\"{Math.Max(11, fontSize - 1)}px\"");
            builder.Append(" color=\"#94a3b8\"");
            if (!string.IsNullOrWhiteSpace(block.FontFamily))
            {
                builder.Append($" font-family=\"{EncodeAttribute(block.FontFamily)}\"");
            }

            builder.Append($">{SanitizeInline(block.SecondaryText)}</mj-text>");
        }

        return builder.ToString().TrimEnd();
    }

    private static string RenderBadgeBlock(EmailTemplateEditorBlock block)
    {
        var textColor = EncodeAttribute(block.TextColor ?? "#0f172a");
        var backgroundColor = EncodeAttribute(block.BackgroundColor ?? "#e2e8f0");
        var alignment = ToMjmlAlignment(block.Alignment ?? EmailTemplateEditorAlignment.Left);
        var fontSize = block.FontSize ?? 13;
        var borderWidth = block.BorderWidth ?? 0;
        var borderColor = block.BorderColor ?? textColor;
        var borderRadius = block.BorderRadius ?? 9999;
        var letterSpacing = block.LetterSpacing is not null ? $"letter-spacing:{block.LetterSpacing.Value}px;" : string.Empty;
        var textTransform = block.TextTransform is not null ? $"text-transform:{ToCssTextTransform(block.TextTransform.Value)};" : string.Empty;
        var textDecoration = block.TextDecoration is not null ? $"text-decoration:{ToCssTextDecoration(block.TextDecoration.Value)};" : string.Empty;
        var content = $"<span style=\"display:inline-block;background-color:{backgroundColor};color:{textColor};padding:4px 12px;border-radius:{borderRadius}px;font-size:{fontSize}px;font-weight:{EncodeAttribute(block.FontWeight ?? "600")};line-height:{FormatCssLineHeight(block.LineHeight)};{letterSpacing}{textTransform}{textDecoration}border:{borderWidth}px solid {EncodeAttribute(borderColor)};\">{SanitizeInline(block.TextContent)}</span>";
        var paddingAttr = block.BlockPadding is not null ? $" padding=\"{block.BlockPadding.Value}px\"" : string.Empty;
        return $"        <mj-text align=\"{alignment}\"{paddingAttr}>{content}</mj-text>";
    }

    private static string RenderQuoteBlock(EmailTemplateEditorBlock block)
    {
        var builder = new StringBuilder();
        var alignment = ToMjmlAlignment(block.Alignment ?? EmailTemplateEditorAlignment.Left);
        var textColor = EncodeAttribute(block.TextColor ?? "#334155");
        var fontSize = block.FontSize ?? 18;

        builder.Append("        <mj-text");
        AppendTextStyleAttributes(builder, block, fontSize, block.TextColor ?? "#334155", null, includeAlignment: false);
        builder.Append(" font-style=\"italic\"");
        AppendBoxAttributes(builder, block);
        AppendPaddingAttribute(builder, block);
        builder.Append($" align=\"{alignment}\"");
        builder.Append(">&ldquo;");
        builder.Append(SanitizeInline(block.TextContent));
        builder.Append("&rdquo;</mj-text>");
        builder.AppendLine();

        if (!string.IsNullOrWhiteSpace(block.SecondaryText))
        {
            builder.Append(
                $"        <mj-text font-size=\"14px\" color=\"#64748b\" align=\"{alignment}\">{SanitizeInline(block.SecondaryText)}</mj-text>");
        }

        return builder.ToString().TrimEnd();
    }


    private static string RenderLinksBlock(EmailTemplateEditorBlock block, bool inlineByDefault, EmailTemplateEditorAlignment defaultAlignment)
    {
        var inline = GetBlockLayout(block, inlineByDefault ? EmailTemplateEditorBlockLayout.Horizontal : EmailTemplateEditorBlockLayout.Vertical)
            != EmailTemplateEditorBlockLayout.Vertical;
        var alignment = ToMjmlAlignment(block.Alignment ?? defaultAlignment);
        var fontSize = block.FontSize ?? 14;
        var textColor = EncodeAttribute(block.TextColor ?? "#2563eb");
        // Inline links use HTML separators because MJML does not provide a richer list primitive for this case.
        var separator = inline ? "&nbsp;&nbsp;&bull;&nbsp;&nbsp;" : "<br />";
        var links = string.Join(
            separator,
            block.Items.Select(item =>
                $"<a href=\"{EncodeAttribute(item.Url)}\" style=\"color:{textColor};text-decoration:none;font-weight:600;\">{EncodeText(item.Label)}</a>"));
        var paddingAttr = block.BlockPadding is not null ? $" padding=\"{block.BlockPadding.Value}px\"" : string.Empty;
        return $"        <mj-text font-size=\"{fontSize}px\" color=\"{textColor}\" align=\"{alignment}\"{paddingAttr}>{links}</mj-text>";
    }

    private static void AppendTextStyleAttributes(
        StringBuilder builder,
        EmailTemplateEditorBlock block,
        int? fontSize,
        string? textColor,
        string? defaultFontWeight,
        bool includeAlignment = true)
    {
        if (fontSize is not null)
        {
            builder.Append($" font-size=\"{fontSize.Value}px\"");
        }

        if (!string.IsNullOrWhiteSpace(textColor))
        {
            builder.Append($" color=\"{EncodeAttribute(textColor)}\"");
        }

        if (includeAlignment)
        {
            builder.Append($" align=\"{ToMjmlAlignment(block.Alignment)}\"");
        }

        if (!string.IsNullOrWhiteSpace(block.FontFamily))
        {
            builder.Append($" font-family=\"{EncodeAttribute(block.FontFamily)}\"");
        }

        if (!string.IsNullOrWhiteSpace(block.FontWeight ?? defaultFontWeight))
        {
            builder.Append($" font-weight=\"{EncodeAttribute(block.FontWeight ?? defaultFontWeight!)}\"");
        }

        if (block.LineHeight is not null)
        {
            builder.Append($" line-height=\"{block.LineHeight.Value}px\"");
        }

        if (block.LetterSpacing is not null)
        {
            builder.Append($" letter-spacing=\"{block.LetterSpacing.Value}px\"");
        }

        if (block.TextTransform is not null)
        {
            builder.Append($" text-transform=\"{ToCssTextTransform(block.TextTransform.Value)}\"");
        }

        if (block.TextDecoration is not null)
        {
            builder.Append($" text-decoration=\"{ToCssTextDecoration(block.TextDecoration.Value)}\"");
        }
    }

    private static void AppendPaddingAttribute(StringBuilder builder, EmailTemplateEditorBlock block)
    {
        if (block.BlockPadding is not null)
        {
            builder.Append($" padding=\"{block.BlockPadding.Value}px\"");
        }
    }

    private static void AppendBoxAttributes(StringBuilder builder, EmailTemplateEditorBlock block)
    {
        AppendBorderAttributes(builder, block);

        if (block.BorderRadius is not null)
        {
            builder.Append($" border-radius=\"{block.BorderRadius.Value}px\"");
        }
    }

    private static void AppendBorderAttributes(StringBuilder builder, EmailTemplateEditorBlock block)
    {
        if (block.BorderWidth is not null && !string.IsNullOrWhiteSpace(block.BorderColor))
        {
            builder.Append($" border=\"{block.BorderWidth.Value}px solid {EncodeAttribute(block.BorderColor)}\"");
        }
        else
        {
            if (block.BorderWidth is not null)
            {
                builder.Append($" border-width=\"{block.BorderWidth.Value}px\"");
            }

            if (!string.IsNullOrWhiteSpace(block.BorderColor))
            {
                builder.Append($" border-color=\"{EncodeAttribute(block.BorderColor)}\"");
            }
        }
    }

    private static void AppendWidthAttribute(StringBuilder builder, int? widthPercentage)
    {
        if (widthPercentage is not null)
        {
            builder.Append($" width=\"{widthPercentage.Value}%\"");
        }
    }

    private static string ToMjmlAlignment(EmailTemplateEditorAlignment? alignment)
    {
        return alignment switch
        {
            EmailTemplateEditorAlignment.Center => "center",
            EmailTemplateEditorAlignment.Right => "right",
            _ => "left"
        };
    }

    private static string ToMjmlVerticalAlignment(EmailTemplateEditorVerticalAlignment alignment)
    {
        return alignment switch
        {
            EmailTemplateEditorVerticalAlignment.Middle => "middle",
            EmailTemplateEditorVerticalAlignment.Bottom => "bottom",
            _ => "top"
        };
    }

    private static string ToCssTextTransform(EmailTemplateEditorTextTransform textTransform)
    {
        return textTransform switch
        {
            EmailTemplateEditorTextTransform.Uppercase => "uppercase",
            EmailTemplateEditorTextTransform.Lowercase => "lowercase",
            EmailTemplateEditorTextTransform.Capitalize => "capitalize",
            _ => "none"
        };
    }

    private static string ToCssTextDecoration(EmailTemplateEditorTextDecoration textDecoration)
    {
        return textDecoration switch
        {
            EmailTemplateEditorTextDecoration.Underline => "underline",
            EmailTemplateEditorTextDecoration.LineThrough => "line-through",
            _ => "none"
        };
    }

    private static string ToCssTextAlign(EmailTemplateEditorAlignment? alignment)
    {
        return alignment switch
        {
            EmailTemplateEditorAlignment.Center => "center",
            EmailTemplateEditorAlignment.Right => "right",
            _ => "left"
        };
    }

    private static string BuildCardContainerStyle(
        EmailTemplateEditorBlock block,
        string defaultBackgroundColor,
        string defaultBorderColor,
        int defaultBorderWidth,
        int defaultBorderRadius)
    {
        var borderWidth = block.BorderWidth ?? defaultBorderWidth;
        var borderColor = block.BorderColor ?? defaultBorderColor;
        var builder = new StringBuilder();
        builder.Append($"background-color:{EncodeAttribute(block.BackgroundColor ?? defaultBackgroundColor)};");
        if (borderWidth > 0)
        {
            builder.Append($"border:{borderWidth}px solid {EncodeAttribute(borderColor)};");
        }
        builder.Append($"border-radius:{block.BorderRadius ?? defaultBorderRadius}px;");
        builder.Append("overflow:hidden;");
        return builder.ToString();
    }

    private static string BuildTextStyle(
        EmailTemplateEditorBlock block,
        int defaultFontSize,
        string defaultColor,
        string? defaultFontWeight,
        bool includeAlignment = true)
    {
        var builder = new StringBuilder();
        builder.Append($"font-size:{block.FontSize ?? defaultFontSize}px;");
        builder.Append($"color:{EncodeAttribute(block.TextColor ?? defaultColor)};");
        if (includeAlignment)
        {
            builder.Append($"text-align:{ToCssTextAlign(block.Alignment)};");
        }
        if (!string.IsNullOrWhiteSpace(block.FontFamily))
        {
            builder.Append($"font-family:{EncodeAttribute(block.FontFamily)};");
        }
        if (!string.IsNullOrWhiteSpace(block.FontWeight ?? defaultFontWeight))
        {
            builder.Append($"font-weight:{EncodeAttribute(block.FontWeight ?? defaultFontWeight!)};");
        }
        if (block.LineHeight is not null)
        {
            builder.Append($"line-height:{block.LineHeight.Value}px;");
        }
        if (block.LetterSpacing is not null)
        {
            builder.Append($"letter-spacing:{block.LetterSpacing.Value}px;");
        }
        if (block.TextTransform is not null)
        {
            builder.Append($"text-transform:{ToCssTextTransform(block.TextTransform.Value)};");
        }
        if (block.TextDecoration is not null)
        {
            builder.Append($"text-decoration:{ToCssTextDecoration(block.TextDecoration.Value)};");
        }
        return builder.ToString();
    }

    private static string BuildHtmlButton(string label, string url, string backgroundColor, string textColor)
    {
        return $"<a href=\"{EncodeAttribute(url)}\" style=\"display:inline-block;background-color:{EncodeAttribute(backgroundColor)};color:{EncodeAttribute(textColor)};padding:10px 16px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;\">{EncodeText(label)}</a>";
    }

    private static string BuildOptionalHtmlButton(EmailTemplateEditorBlock block, string backgroundColor, string textColor)
    {
        return string.IsNullOrWhiteSpace(block.ActionLabel) || string.IsNullOrWhiteSpace(block.ActionUrl)
            ? string.Empty
            : BuildHtmlButton(block.ActionLabel, block.ActionUrl, backgroundColor, textColor);
    }

    private static EmailTemplateEditorBlockLayout GetBlockLayout(EmailTemplateEditorBlock block, EmailTemplateEditorBlockLayout defaultLayout)
    {
        return block.Layout ?? defaultLayout;
    }

    private static EmailTemplateEditorBlockActionPlacement GetActionPlacement(EmailTemplateEditorBlock block)
    {
        return block.ActionPlacement ?? EmailTemplateEditorBlockActionPlacement.AfterContent;
    }

    private static string FormatCssLineHeight(int? lineHeight)
    {
        return lineHeight is null ? "1.2" : $"{lineHeight.Value}px";
    }

    private static string EncodeText(string value) => WebUtility.HtmlEncode(value);

    private static string EncodeAttribute(string value) => WebUtility.HtmlEncode(value);

    private static HtmlSanitizer CreateBlockSanitizer()
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.Add("strong");
        sanitizer.AllowedTags.Add("em");
        sanitizer.AllowedTags.Add("u");
        sanitizer.AllowedTags.Add("a");
        sanitizer.AllowedTags.Add("br");
        sanitizer.AllowedTags.Add("p");
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.Add("href");
        sanitizer.AllowedAttributes.Add("target");
        sanitizer.AllowedAttributes.Add("style");
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedCssProperties.Add("color");
        sanitizer.AllowedCssProperties.Add("font-family");
        sanitizer.AllowedCssProperties.Add("text-decoration");
        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.Add("http");
        sanitizer.AllowedSchemes.Add("https");
        sanitizer.AllowedSchemes.Add("mailto");
        sanitizer.PostProcessNode += AddRelToBlankLinks;
        return sanitizer;
    }

    private static HtmlSanitizer CreateInlineSanitizer()
    {
        var sanitizer = new HtmlSanitizer();
        sanitizer.AllowedTags.Clear();
        sanitizer.AllowedTags.Add("strong");
        sanitizer.AllowedTags.Add("em");
        sanitizer.AllowedTags.Add("u");
        sanitizer.AllowedTags.Add("a");
        sanitizer.AllowedAttributes.Clear();
        sanitizer.AllowedAttributes.Add("href");
        sanitizer.AllowedAttributes.Add("target");
        sanitizer.AllowedAttributes.Add("style");
        sanitizer.AllowedCssProperties.Clear();
        sanitizer.AllowedCssProperties.Add("color");
        sanitizer.AllowedCssProperties.Add("font-family");
        sanitizer.AllowedCssProperties.Add("text-decoration");
        sanitizer.AllowedSchemes.Clear();
        sanitizer.AllowedSchemes.Add("http");
        sanitizer.AllowedSchemes.Add("https");
        sanitizer.AllowedSchemes.Add("mailto");
        sanitizer.PostProcessNode += AddRelToBlankLinks;
        return sanitizer;
    }

    private static void AddRelToBlankLinks(object? sender, PostProcessNodeEventArgs args)
    {
        if (args.Node is AngleSharp.Dom.IElement el &&
            el.TagName.Equals("A", StringComparison.OrdinalIgnoreCase) &&
            el.GetAttribute("target") == "_blank")
        {
            el.SetAttribute("rel", "noopener noreferrer");
        }
    }

    private static string SanitizeBlock(string? value)
    {
        var sanitizer = CreateBlockSanitizer();
        return sanitizer.Sanitize(value ?? string.Empty);
    }

    private static string SanitizeInline(string? value)
    {
        var sanitizer = CreateInlineSanitizer();
        return sanitizer.Sanitize(value ?? string.Empty);
    }
}
