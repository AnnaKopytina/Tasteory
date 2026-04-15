using Amazon.S3;
using Amazon.S3.Model;
using Application.Interfaces.Services;
using Microsoft.Extensions.Options;

namespace Infrastructure.Media;

public class S3FileStorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly S3Options _options;

    public S3FileStorageService(IAmazonS3 s3Client, IOptions<S3Options> options)
    {
        _s3Client = s3Client;
        _options = options.Value;
    }

    public async Task<string> UploadAsync(Stream stream, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var key = $"{_options.MediaPrefix}{Guid.NewGuid():N}{extension}";

        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = stream,
            AutoCloseStream = false
        };

        await _s3Client.PutObjectAsync(request);

        return $"https://{_options.BucketName}.storage.yandexcloud.net/{key}";
    }

    public async Task DeleteAsync(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return;
        }

        var key = url.Contains("storage.yandexcloud.net/")
            ? url.Split(["storage.yandexcloud.net/"], StringSplitOptions.None)[1]
            : url;

        await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key
        });
    }
}