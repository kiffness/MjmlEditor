using MjmlEditor.Application.Contracts.Templates;
using MjmlEditor.Application.Templates;
using MjmlEditor.Domain.Templates;

namespace MjmlEditor.Application.Tests.Templates;

public sealed class EmailTemplateValidationTests
{
    [Fact]
    public void ValidateCreate_AllowsEmptyMjmlBody_WhenEditorDocumentIsPresent()
    {
        var request = new CreateEmailTemplateRequest(
            "Spring campaign",
            "Fresh listings this week",
            string.Empty,
            CreateEditorDocument(new EmailTemplateEditorBlockDto
            {
                Id = "hero-1",
                Type = EmailTemplateEditorBlockType.Hero,
                TextContent = "Fresh campaign headline"
            }));

        var result = EmailTemplateValidation.ValidateCreate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidateCreate_RequiresImageUrl_ForImageBlocks()
    {
        var request = new CreateEmailTemplateRequest(
            "Property email",
            "Featured listing",
            string.Empty,
            CreateEditorDocument(new EmailTemplateEditorBlockDto
            {
                Id = "property-1",
                Type = EmailTemplateEditorBlockType.Image,
                TextContent = "Family home with garden"
            }));

        var result = EmailTemplateValidation.ValidateCreate(request);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            error => error.Field == "EditorDocument.Sections[0].Columns[0].Blocks[0].ImageUrl");
    }

    private static EmailTemplateEditorDocumentDto CreateEditorDocument(EmailTemplateEditorBlockDto block)
    {
        return new EmailTemplateEditorDocumentDto
        {
            Version = 1,
            Sections =
            [
                new EmailTemplateEditorSectionDto
                {
                    Id = "section-1",
                    Padding = 24,
                    Columns =
                    [
                        new EmailTemplateEditorColumnDto
                        {
                            Id = "column-1",
                            WidthPercentage = 100,
                            VerticalAlignment = EmailTemplateEditorVerticalAlignment.Top,
                            Blocks = [block]
                        }
                    ]
                }
            ]
        };
    }
}
