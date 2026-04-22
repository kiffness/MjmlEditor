namespace MjmlEditor.Application.Exceptions;

public sealed class AccessDeniedException(string message) : Exception(message);
