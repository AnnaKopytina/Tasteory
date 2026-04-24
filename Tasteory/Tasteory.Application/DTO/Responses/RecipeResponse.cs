namespace Application.DTO.Responses;

public class RecipeResponse
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? MainImage { get; init; }
    public string? MainText { get; init; }
    public Guid AuthorId { get; init; }
    public string AuthorName { get; set; } = string.Empty; 
    public decimal Rating { get; init; }
    public bool IsPrivate { get; init; }
    public int TimeMinutes { get; init; }
    public int BasePortions { get; init; }
    public List<string> Tags { get; init; } = new();
    public List<IngredientDto> Ingredients { get; init; } = new();
    public List<StepDto> Steps { get; init; } = new();
    public bool IsFavorite { get; set; } 
    public int FavoritesCount { get; set; }
}