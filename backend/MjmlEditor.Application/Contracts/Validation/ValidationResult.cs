namespace MjmlEditor.Application.Contracts.Validation;

public sealed class ValidationResult
{
    public static readonly ValidationResult Success = new([]);

    public ValidationResult(IReadOnlyList<ValidationError> errors)
    {
        Errors = errors;
    }

    public IReadOnlyList<ValidationError> Errors { get; }

    public bool IsValid => Errors.Count == 0;
}
