namespace MjmlEditor.Application.Media;

public interface IMediaUploadService
{
    /// <summary>
    /// Uploads an image stream to remote storage and returns the public URL.
    /// </summary>
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentType, CancellationToken cancellationToken);
}
