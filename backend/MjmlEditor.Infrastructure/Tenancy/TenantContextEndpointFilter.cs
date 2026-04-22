using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Application.Exceptions;
using MjmlEditor.Application.Tenancy;
using Microsoft.AspNetCore.Http;

namespace MjmlEditor.Infrastructure.Tenancy;

public sealed class TenantContextEndpointFilter(
    ITenantRepository tenantRepository,
    IUserAccountRepository userAccountRepository,
    ICurrentUserAccessor currentUserAccessor) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        var userId = currentUserAccessor.GetRequiredUserId();

        if (!httpContext.Request.Headers.TryGetValue(TenantConstants.HeaderName, out var tenantHeaderValues))
        {
            throw BuildHeaderException($"{TenantConstants.HeaderName} header is required.");
        }

        if (tenantHeaderValues.Count != 1)
        {
            throw BuildHeaderException($"{TenantConstants.HeaderName} header must contain a single tenant id.");
        }

        var tenantId = tenantHeaderValues[0]?.Trim();

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw BuildHeaderException($"{TenantConstants.HeaderName} header is required.");
        }

        if (!await tenantRepository.ExistsAsync(tenantId, httpContext.RequestAborted))
        {
            throw BuildHeaderException($"{TenantConstants.HeaderName} header does not match a known tenant.");
        }

        if (!await userAccountRepository.HasTenantAccessAsync(userId, tenantId, httpContext.RequestAborted))
        {
            throw new AccessDeniedException($"The authenticated user does not have access to tenant '{tenantId}'.");
        }

        httpContext.Items[TenantConstants.HttpContextItemKey] = tenantId;

        return await next(context);
    }

    private static RequestValidationException BuildHeaderException(string message)
    {
        return new RequestValidationException([
            new ValidationError(TenantConstants.HeaderName, message)
        ]);
    }
}
