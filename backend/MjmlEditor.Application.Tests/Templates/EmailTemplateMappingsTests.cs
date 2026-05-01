using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Templates;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Tests.Templates;

public sealed class EmailTemplateMappingsTests
{
    [Fact]
    public void ToDomain_AndBackToDto_PreservesStructuredBlockFields()
    {
        var document = new EmailTemplateEditorDocumentDto
        {
            Version = 1,
            Sections =
            [
                new EmailTemplateEditorSectionDto
                {
                    Id = "section-1",
                    BackgroundColor = "#ffffff",
                    Padding = 32,
                    Columns =
                    [
                        new EmailTemplateEditorColumnDto
                        {
                            Id = "column-1",
                            WidthPercentage = 100,
                            VerticalAlignment = EmailTemplateEditorVerticalAlignment.Middle,
                            Blocks =
                            [
                                new EmailTemplateEditorBlockDto
                                {
                                    Id = "property-1",
                                    Type = EmailTemplateEditorBlockType.PropertyCard,
                                    TextContent = "Park-side family home",
                                    SecondaryText = "Guide price {{ params.price }}",
                                    ImageUrl = "https://example.com/property.jpg",
                                    AltText = "Property exterior",
                                    ActionLabel = "View property",
                                    ActionUrl = "https://example.com/property",
                                    BackgroundColor = "#ffffff",
                                    TextColor = "#0f172a",
                                    Alignment = EmailTemplateEditorAlignment.Center,
                                    FontFamily = "Arial, sans-serif",
                                    FontWeight = "700",
                                    FontSize = 22,
                                    LineHeight = 30,
                                    LetterSpacing = 1,
                                    TextTransform = EmailTemplateEditorTextTransform.Uppercase,
                                    TextDecoration = EmailTemplateEditorTextDecoration.Underline,
                                    Layout = EmailTemplateEditorBlockLayout.HorizontalReverse,
                                    ActionPlacement = EmailTemplateEditorBlockActionPlacement.BeforeContent,
                                    BorderColor = "#dbe4f0",
                                    BorderWidth = 1,
                                    BorderRadius = 20,
                                    WidthPercentage = 100
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        var roundTripped = document.ToDomain().ToDto();
        var block = roundTripped.Sections[0].Columns[0].Blocks[0];

        Assert.Equal(EmailTemplateEditorBlockLayout.HorizontalReverse, block.Layout);
        Assert.Equal(EmailTemplateEditorBlockActionPlacement.BeforeContent, block.ActionPlacement);
        Assert.Equal(EmailTemplateEditorAlignment.Center, block.Alignment);
        Assert.Equal("Arial, sans-serif", block.FontFamily);
        Assert.Equal("#dbe4f0", block.BorderColor);
        Assert.Equal(20, block.BorderRadius);
        Assert.Equal("View property", block.ActionLabel);
    }
}
