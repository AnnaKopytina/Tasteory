namespace Application.DTO.Responses;

public record RecipeResponse(
    Guid Id,
    List<string> Tags,
    double Rating,
    bool IsPrivate,
    string Title,
    string MainImage,
    string MainText,
    string Author,
    TimeDto Time,
    List<IngredientDto> Ingredients,
    List<StepDto> Steps);