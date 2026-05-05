using System.ComponentModel.DataAnnotations;

namespace MjmlEditor.Infrastructure.Media;

public sealed class R2Options
{
    public const string SectionName = "R2";

    [Required]
    public string AccountId { get; init; } = string.Empty;

    [Required]
    public string BucketName { get; init; } = string.Empty;

    [Required]
    public string AccessKeyId { get; init; } = string.Empty;

    [Required]
    public string SecretAccessKey { get; init; } = string.Empty;

    [Required]
    public string PublicBaseUrl { get; init; } = string.Empty;
}
