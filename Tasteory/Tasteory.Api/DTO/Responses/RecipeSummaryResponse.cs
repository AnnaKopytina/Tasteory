namespace Tasteory.Api.DTOs;

public record RecipeSummaryResponse(
    Guid Id,
    List<string> Tags,
    double Rating,
    bool IsPrivate,
    string Title,
    string MainImage,
    string MainText,
    string Author);