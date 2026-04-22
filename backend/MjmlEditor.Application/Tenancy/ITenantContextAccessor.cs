namespace MjmlEditor.Application.Tenancy;

public interface ITenantContextAccessor
{
    string GetRequiredTenantId();
}
