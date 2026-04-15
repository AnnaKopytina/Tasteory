using Domain.Enums;

namespace Application.DTO.Responses;

public class MediaUploadResponse
{
    public string Url { get; set; } = string.Empty;
    public MediaType MediaType { get; set; }
    public long SizeBytes { get; set; }
}