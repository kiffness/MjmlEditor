using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using MjmlEditor.Application.Media;

namespace MjmlEditor.Infrastructure.Media;

internal sealed class R2MediaUploadService(IOptions<R2Options> options) : IMediaUploadService
{
    private readonly R2Options _options = options.Value;

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp"
    };

    /// <inheritdoc />
    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        if (!AllowedContentTypes.Contains(contentType))
            throw new InvalidOperationException($"Unsupported image type: {contentType}");

        var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        var key = $"uploads/{Guid.NewGuid():N}.{ext}";

        var credentials = new BasicAWSCredentials(_options.AccessKeyId, _options.SecretAccessKey);
        var config = new AmazonS3Config
        {
            ServiceURL = $"https://{_options.AccountId}.r2.cloudflarestorage.com",
            ForcePathStyle = true,
        };

        using var s3 = new AmazonS3Client(credentials, config);

        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = imageStream,
            ContentType = contentType,
            DisablePayloadSigning = true,
        };

        await s3.PutObjectAsync(request, cancellationToken);

        return $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}";
    }
}
