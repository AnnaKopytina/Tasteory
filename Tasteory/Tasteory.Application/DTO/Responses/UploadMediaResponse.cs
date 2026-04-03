namespace Application.DTO.Responses;

public record UploadMediaResponse(
    Guid MediaId,
    string Url,
    string Type // всегда "photo"! пока
);