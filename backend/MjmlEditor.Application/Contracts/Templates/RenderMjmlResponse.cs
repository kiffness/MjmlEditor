namespace MjmlEditor.Application.Contracts.Templates;

public sealed record RenderMjmlResponse(
    string Html,
    IReadOnlyList<MjmlRenderIssueDto> Issues);
