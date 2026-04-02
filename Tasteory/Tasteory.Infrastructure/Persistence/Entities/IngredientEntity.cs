namespace Infrastructure.Persistence.Entities;

public class IngredientEntity
{
    public Guid Id { get; set; }
    public Guid RecipeId { get; set; }
    public RecipeEntity Recipe { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Measure { get; set; }
}