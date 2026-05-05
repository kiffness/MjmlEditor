using MjmlEditor.Application.Templates;
using MjmlEditor.Domain.Templates;
using Mjml.Net;

namespace MjmlEditor.Application.Tests.Templates;

public sealed class EmailTemplateMjmlGeneratorTests
{
    private static EmailTemplateEditorDocument BuildDocument(string textContent)
    {
        return EmailTemplateEditorDocument.Create(
            1,
            [
                EmailTemplateEditorSection.Create(
                    "s1",
                    null,
                    null,
                    null,
                    [
                        EmailTemplateEditorColumn.Create(
                            "c1",
                            100,
                            null,
                            null,
                            null,
                            [
                                EmailTemplateEditorBlock.Create(
                                    "b1",
                                    EmailTemplateEditorBlockType.Text,
                                    textContent,
                                    null, null, null, null, null,
                                    null, null, null, null, null,
                                    null, null, null, null, null,
                                    null, null, null, null, null,
                                    null, null, null, null, null,
                                    null, [])
                            ])
                    ])
            ]);
    }

    [Fact]
    public void Generate_PreservesColorSpanInMjml()
    {
        var generator = new EmailTemplateMjmlGenerator();
        var doc = BuildDocument("<p><span style=\"color: #ff0000\">Hello</span> world</p>");

        var mjml = generator.Generate(doc);

        // After sanitization, #ff0000 is normalised to rgba(255, 0, 0, 1) but the span must be present
        Assert.Contains("<span", mjml);
        Assert.Contains("color", mjml);
        Assert.Contains("Hello", mjml);
    }

    [Fact]
    public void Generate_PlainTextIsUnaffected()
    {
        var generator = new EmailTemplateMjmlGenerator();
        var doc = BuildDocument("<p>Hello world</p>");

        var mjml = generator.Generate(doc);

        Assert.Contains("Hello world", mjml);
    }

    [Fact]
    public void Generate_PreservesLinkTextInMjml()
    {
        var generator = new EmailTemplateMjmlGenerator();
        var doc = BuildDocument("<p>Hello <a href=\"https://example.com\" target=\"_blank\">world</a> there</p>");

        var mjml = generator.Generate(doc);

        Assert.Contains("world", mjml);
        Assert.Contains("href=\"https://example.com\"", mjml);
    }

    [Fact]
    public void Generate_PreservesLinkTextWhenWrappedInColorSpan()
    {
        var generator = new EmailTemplateMjmlGenerator();
        // Tiptap may render colored+linked text as <span style="color:red"><a href="...">word</a></span>
        var doc = BuildDocument("<p>Hello <span style=\"color: #ff0000\"><a href=\"https://example.com\" target=\"_blank\">world</a></span> there</p>");

        var mjml = generator.Generate(doc);

        Assert.Contains("world", mjml);
        Assert.Contains("href=\"https://example.com\"", mjml);
    }

    [Fact]
    public void Generate_PreservesLinkTextWhenColorInsideLink()
    {
        var generator = new EmailTemplateMjmlGenerator();
        // Alternatively Tiptap may render as <a href="..."><span style="color:red">word</span></a>
        var doc = BuildDocument("<p>Hello <a href=\"https://example.com\" target=\"_blank\"><span style=\"color: #ff0000\">world</span></a> there</p>");

        var mjml = generator.Generate(doc);

        Assert.Contains("world", mjml);
        Assert.Contains("href=\"https://example.com\"", mjml);
    }

    [Fact]
    public void Generate_ExactPayloadStructure_PreservesLinkText()
    {
        // Exact structure from the real browser payload
        var generator = new EmailTemplateMjmlGenerator();
        var doc = BuildDocument(
            "<p>Voluptas consequatur tenetur qui sunt " +
            "<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://google.com\">" +
            "<span style=\"color: rgb(148, 10, 10);\">voluptatem</span>" +
            "</a> corporis aspernatur.</p>");

        var mjml = generator.Generate(doc);

        Assert.Contains("voluptatem", mjml);
    }

    [Fact]
    public async Task Render_NestedLinkInMjmlText_PreservesLinkText()
    {
        // Integration test: full MJML generation + MJML.Net rendering
        var generator = new EmailTemplateMjmlGenerator();
        var doc = BuildDocument(
            "<p>Voluptas consequatur tenetur qui sunt " +
            "<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" href=\"https://google.com\">" +
            "<span style=\"color: rgb(148, 10, 10);\">voluptatem</span>" +
            "</a> corporis aspernatur.</p>");

        var mjml = generator.Generate(doc);

        var mjmlRenderer = new MjmlRenderer();
        var result = await mjmlRenderer.RenderAsync(mjml, new MjmlOptions { Beautify = false, KeepComments = false });

        Assert.NotNull(result.Html);
        Assert.Contains("voluptatem", result.Html);
        Assert.Contains("google.com", result.Html);
        // Text must appear inside the anchor, not outside it
        Assert.Contains("voluptatem</span>", result.Html);
    }
}
