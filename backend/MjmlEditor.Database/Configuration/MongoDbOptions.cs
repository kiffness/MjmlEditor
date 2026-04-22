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
}
