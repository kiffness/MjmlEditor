using System.Net;
using System.Text;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Templates;

internal sealed class EmailTemplateMjmlGenerator : IEmailTemplateMjmlGenerator
{
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
                builder.AppendLine($"      <mj-column width=\"{column.WidthPercentage}%\">");

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
            _ => throw new ArgumentOutOfRangeException(nameof(block), block.Type, "Unsupported editor block type.")
        };
    }

    private static string RenderTextBlock(EmailTemplateEditorBlock block, int defaultFontSize, bool isHero)
    {
        var builder = new StringBuilder();
        builder.Append("        <mj-text");
        builder.Append($" font-size=\"{block.FontSize ?? defaultFontSize}px\"");
        builder.Append($" color=\"{EncodeAttribute(block.TextColor ?? (isHero ? "#1f2937" : "#4b5563"))}\"");
        builder.Append($" align=\"{ToMjmlAlignment(block.Alignment)}\"");

        if (isHero)
        {
            builder.Append(" font-weight=\"700\"");
        }

        builder.Append(">");
        builder.Append(EncodeText(block.TextContent ?? string.Empty));
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
        builder.Append(" />");
        return builder.ToString();
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

    private static string EncodeText(string value) => WebUtility.HtmlEncode(value);

    private static string EncodeAttribute(string value) => WebUtility.HtmlEncode(value);
}
