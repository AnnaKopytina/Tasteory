namespace Application.DTO.Responses;

public record RecipeSummaryResponse(
    Guid Id,
    string Title,
    string? MainImage,
    string? MainText,
    Guid AuthorId,
    string AuthorName,
    decimal Rating,
    bool IsPrivate,
    int TimeMinutes,
    List<string> Tags
);