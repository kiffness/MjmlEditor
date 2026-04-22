using MjmlEditor.Application.Templates;
using MjmlOptions = Mjml.Net.MjmlOptions;
using MjmlRendererEngine = Mjml.Net.MjmlRenderer;

namespace MjmlEditor.Infrastructure.Templates;

internal sealed class MjmlNetRenderer : IMjmlRenderer
{
    private static readonly MjmlOptions RenderOptions = new()
    {
        Beautify = true,
        KeepComments = false
    };

    private readonly MjmlRendererEngine renderer = new();

    public async Task<MjmlRenderResult> RenderAsync(string mjmlBody, CancellationToken cancellationToken)
    {
        var renderResult = await renderer.RenderAsync(mjmlBody, RenderOptions, cancellationToken);
        List<MjmlRenderIssue> issues = [];

        foreach (var error in renderResult.Errors)
        {
            issues.Add(new MjmlRenderIssue(
                error.Error,
                error.Type.ToString(),
                error.Position.LineNumber > 0 ? error.Position.LineNumber : null,
                error.Position.LinePosition > 0 ? error.Position.LinePosition : null));
        }

        return new MjmlRenderResult(renderResult.Html, issues);
    }
}
