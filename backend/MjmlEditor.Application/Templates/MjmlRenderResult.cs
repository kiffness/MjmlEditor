namespace MjmlEditor.Application.Templates;

public sealed record MjmlRenderResult(
    string Html,
    IReadOnlyList<MjmlRenderIssue> Issues);
