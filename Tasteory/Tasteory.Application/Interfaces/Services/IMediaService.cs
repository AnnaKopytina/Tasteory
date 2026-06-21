using Application.DTO.Responses;

namespace Application.Interfaces.Services;

public interface IMediaService
{
    public Task<MediaUploadResponse> UploadAsync(Stream stream, string fileName, string contentType, long sizeBytes);
}