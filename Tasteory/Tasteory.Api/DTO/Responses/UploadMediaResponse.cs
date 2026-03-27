namespace Tasteory.Api.DTOs;

public record UploadMediaResponse(
    Guid MediaId,
    string Url,
    string Type // всегда "photo"! пока
);