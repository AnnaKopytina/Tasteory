namespace Application.DTO.Requests;

public record CreateRecipeRequest(
    string Title,
    string? MainImage,
    string? MainText,
    bool IsPrivate,
    int TimeMinutes,
    int BasePortions,
    string[]? Tags, 
    List<IngredientDto>? Ingredients,
    List<StepDto>? Steps
);