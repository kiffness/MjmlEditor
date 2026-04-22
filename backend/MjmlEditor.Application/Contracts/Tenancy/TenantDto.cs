namespace MjmlEditor.Application.Contracts.Tenancy;

public sealed record TenantDto(
    string Id,
    string Name,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
