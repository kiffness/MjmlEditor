namespace MjmlEditor.Application.Exceptions;

public sealed class EntityNotFoundException(string entityName, string entityId)
    : Exception($"{entityName} '{entityId}' was not found.")
{
    public string EntityName { get; } = entityName;

    public string EntityId { get; } = entityId;
}
