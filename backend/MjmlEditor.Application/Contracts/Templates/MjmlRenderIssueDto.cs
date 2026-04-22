namespace MjmlEditor.Application.Contracts.Templates;

public sealed record MjmlRenderIssueDto(
    string Message,
    string Type,
    int? LineNumber,
    int? LinePosition);
