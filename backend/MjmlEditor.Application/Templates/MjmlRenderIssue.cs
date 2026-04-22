namespace MjmlEditor.Application.Templates;

public sealed record MjmlRenderIssue(
    string Message,
    string Type,
    int? LineNumber,
    int? LinePosition);
