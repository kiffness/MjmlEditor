using MjmlEditor.Application.Contracts.Validation;
using MjmlEditor.Application.Exceptions;
using MjmlEditor.Application.Tenancy;
using Microsoft.AspNetCore.Http;

namespace MjmlEditor.Infrastructure.Tenancy;

internal sealed class HeaderTenantContextAccessor(IHttpContextAccessor httpContextAccessor) : ITenantContextAccessor
{
    public string GetRequiredTenantId()
    {
        var httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("Tenant resolution requires an active HTTP request.");

        if (!httpContext.Items.TryGetValue(TenantConstants.HttpContextItemKey, out var tenantIdValue))
        {
            throw new InvalidOperationException("Tenant context was not resolved for the current request.");
        }

        if (tenantIdValue is not string tenantId || string.IsNullOrWhiteSpace(tenantId))
        {
            throw new RequestValidationException([
                new ValidationError(TenantConstants.HeaderName, $"{TenantConstants.HeaderName} header is required.")
            ]);
        }

        return tenantId;
    }
}
