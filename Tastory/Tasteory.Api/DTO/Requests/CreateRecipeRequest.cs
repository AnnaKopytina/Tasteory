using Tastory.DTO;

namespace Tasteory.Api.DTOs;

public record CreateRecipeRequest(
    List<string> Tags,
    bool IsPrivate,
    string Title,
    string MainText,
    TimeDto Time,
    List<IngredientDto> Ingredients,
    List<StepDto> Steps);