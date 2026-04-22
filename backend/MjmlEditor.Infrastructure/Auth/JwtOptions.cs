using System.ComponentModel.DataAnnotations;

namespace MjmlEditor.Infrastructure.Auth;

internal sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required(AllowEmptyStrings = false)]
    public string Issuer { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string Audience { get; init; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string SigningKey { get; init; } = string.Empty;

    [Range(1, 1440)]
    public int TokenLifetimeMinutes { get; init; } = 120;
}
