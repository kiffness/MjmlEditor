using System.ComponentModel.DataAnnotations;

namespace MjmlEditor.Database.Configuration;

public sealed class MongoDbOptions
{
    public const string SectionName = "MongoDb";

    [Required(AllowEmptyStrings = false)]
    public string ConnectionString { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string DatabaseName { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string TenantsCollectionName { get; init; } = "tenants";

    [Required(AllowEmptyStrings = false)]
    public string TemplatesCollectionName { get; init; } = "emailTemplates";

    [Required(AllowEmptyStrings = false)]
    public string UsersCollectionName { get; init; } = "users";

    [Required(AllowEmptyStrings = false)]
    public string BrandLibraryCollectionName { get; init; } = "brand_libraries";

    [Required(AllowEmptyStrings = false)]
    public string SavedSectionsCollectionName { get; init; } = "saved_sections";

    [Required(AllowEmptyStrings = false)]
    public string TenantParamsCollectionName { get; init; } = "tenant_params";
}
