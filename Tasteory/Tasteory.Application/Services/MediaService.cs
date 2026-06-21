using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Services;
using Domain.Enums;

namespace Application.Services;

public class MediaService : IMediaService
{
    private readonly IFileStorageService _storage;
    
    private const long MaxPhotoSize = 10 * 1024 * 1024;  // 10 MB
    private const long MaxVideoSize = 100 * 1024 * 1024; // 100 MB

    public MediaService(IFileStorageService storage)
    {
        _storage = storage;
    }

    public async Task<MediaUploadResponse> UploadAsync(Stream stream, string fileName, string contentType, long sizeBytes)
    {
        var mediaType = MapToMediaType(contentType);

        if (mediaType == MediaType.Photo && sizeBytes > MaxPhotoSize)
        {
            throw new BadRequestException($"Photo size must not exceed {MaxPhotoSize / 1024 / 1024} MB");
        }

        if (mediaType == MediaType.Video && sizeBytes > MaxVideoSize)
        {
            throw new BadRequestException($"Video size must not exceed {MaxVideoSize / 1024 / 1024} MB");
        }

        var url = await _storage.UploadAsync(stream, fileName);

        return new MediaUploadResponse
        {
            Url = url,
            MediaType = mediaType,
            SizeBytes = sizeBytes
        };
    }

    private static MediaType MapToMediaType(string? contentType)
    {
        return contentType?.ToLowerInvariant() switch
        {
            var ct when ct.Contains("image/") => MediaType.Photo,
            var ct when ct.Contains("video/") => MediaType.Video,
            _ => MediaType.Link
        };
    }
}