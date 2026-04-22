using System.Diagnostics;
using MjmlEditor.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace MjmlEditor.Infrastructure.Diagnostics;

internal sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IHostEnvironment hostEnvironment,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;
        var (logLevel, statusCode, title, detail, extensions) = CreateProblem(exception, hostEnvironment.IsDevelopment());

        logger.Log(
            logLevel,
            exception,
            "{Message} {Method} {Path}. TraceId: {TraceId}",
            logLevel == LogLevel.Error ? "Unhandled exception while processing" : "Handled exception while processing",
            httpContext.Request.Method,
            httpContext.Request.Path,
            traceId);

        httpContext.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        foreach (var extension in extensions)
        {
            problemDetails.Extensions[extension.Key] = extension.Value;
        }

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }

    private static (LogLevel LogLevel, int StatusCode, string Title, string Detail, IReadOnlyDictionary<string, object?> Extensions) CreateProblem(
        Exception exception,
        bool isDevelopment)
    {
        return exception switch
        {
            RequestValidationException validationException => (
                LogLevel.Warning,
                StatusCodes.Status400BadRequest,
                "One or more validation errors occurred.",
                validationException.Message,
                new Dictionary<string, object?>
                {
                    ["errors"] = validationException.Errors
                }),
            EntityNotFoundException notFoundException => (
                LogLevel.Information,
                StatusCodes.Status404NotFound,
                "The requested resource was not found.",
                notFoundException.Message,
                new Dictionary<string, object?>()),
            AccessDeniedException accessDeniedException => (
                LogLevel.Warning,
                StatusCodes.Status403Forbidden,
                "Access to the requested resource is forbidden.",
                accessDeniedException.Message,
                new Dictionary<string, object?>()),
            UnauthorizedAccessException unauthorizedAccessException => (
                LogLevel.Warning,
                StatusCodes.Status401Unauthorized,
                "Authentication is required.",
                unauthorizedAccessException.Message,
                new Dictionary<string, object?>()),
            NotSupportedException => (
                LogLevel.Information,
                StatusCodes.Status501NotImplemented,
                "The requested capability is not implemented.",
                isDevelopment
                    ? exception.Message
                    : "The requested capability is not implemented yet.",
                new Dictionary<string, object?>()),
            TimeoutException => (
                LogLevel.Error,
                StatusCodes.Status503ServiceUnavailable,
                "A dependent service is unavailable.",
                isDevelopment
                    ? exception.Message
                    : "A required backend service is currently unavailable.",
                new Dictionary<string, object?>()),
            _ => (
                LogLevel.Error,
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.",
                isDevelopment
                    ? exception.Message
                    : "The server encountered an unexpected error.",
                new Dictionary<string, object?>())
        };
    }
}
