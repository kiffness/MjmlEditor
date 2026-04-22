namespace MjmlEditor.Application.Contracts.Validation;

public sealed record ValidationError(string Field, string Message);
