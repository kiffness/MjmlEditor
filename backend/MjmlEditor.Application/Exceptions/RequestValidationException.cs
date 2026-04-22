using MjmlEditor.Application.Contracts.Validation;

namespace MjmlEditor.Application.Exceptions;

public sealed class RequestValidationException(IReadOnlyList<ValidationError> errors)
    : Exception("One or more validation errors occurred.")
{
    public IReadOnlyList<ValidationError> Errors { get; } = errors;
}
