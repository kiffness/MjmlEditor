using MjmlEditor.Application.Media;

namespace MjmlEditor.Api.Endpoints;

public static class MediaEndpoints
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    public static IEndpointRouteBuilder MapMediaEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/media")
            .WithTags("Media")
            .RequireAuthorization();

        group.MapPost("/upload", async (
            IFormFile file,
            IMediaUploadService uploadService,
            CancellationToken cancellationToken) =>
        {
            if (file.Length == 0)
                return Results.Problem("No file provided.", statusCode: 400);

            if (file.Length > MaxFileSizeBytes)
                return Results.Problem("File exceeds 10 MB limit.", statusCode: 400);

            var contentType = file.ContentType;
            await using var stream = file.OpenReadStream();
            var url = await uploadService.UploadImageAsync(stream, file.FileName, contentType, cancellationToken);

            return Results.Ok(new { url });
        })
        .WithName("UploadMedia")
        .DisableAntiforgery();

        // Proxies a remote image through the API to avoid browser CORS restrictions during canvas crop.
        group.MapGet("/proxy", async (
            string url,
            IHttpClientFactory httpClientFactory,
            CancellationToken cancellationToken) =>
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                return Results.Problem("Invalid URL.", statusCode: 400);

            var client = httpClientFactory.CreateClient();
            var response = await client.GetAsync(uri, cancellationToken);

            if (!response.IsSuccessStatusCode)
                return Results.Problem("Failed to fetch image.", statusCode: 502);

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
            var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return Results.Stream(stream, contentType);
        })
        .WithName("ProxyMedia");

        return endpoints;
    }
}
