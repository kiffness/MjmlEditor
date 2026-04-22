using MjmlEditor.Application.Contracts.Templates;

namespace MjmlEditor.Application.Templates;

internal static class MjmlTemplateMappings
{
    public static RenderMjmlResponse ToResponse(this MjmlRenderResult result)
    {
        return new RenderMjmlResponse(
            result.Html,
            result.Issues
                .Select(issue => new MjmlRenderIssueDto(
                    issue.Message,
                    issue.Type,
                    issue.LineNumber,
                    issue.LinePosition))
                .ToArray());
    }
}
