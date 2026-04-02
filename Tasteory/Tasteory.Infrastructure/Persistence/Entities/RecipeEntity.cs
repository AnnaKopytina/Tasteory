namespace Infrastructure.Persistence.Entities;

public class RecipeEntity
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public UserEntity Author { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? MainImage { get; set; }
    public string? MainText { get; set; }
    public decimal Rating { get; set; }
    public bool IsPrivate { get; set; }
    public int TimeMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<IngredientEntity> Ingredients { get; set; } = new List<IngredientEntity>();
    public ICollection<StepEntity> Steps { get; set; } = new List<StepEntity>();
    public ICollection<GroupRecipeEntity> GroupRecipes { get; set; } = new List<GroupRecipeEntity>();
}