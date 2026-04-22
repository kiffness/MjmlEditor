namespace MjmlEditor.Seed.Configuration;

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public int TemplatesPerTenant { get; init; } = 8;

    public bool ReplaceExistingTenantData { get; init; } = true;

    public string[] TenantIds { get; init; } = [];
}
