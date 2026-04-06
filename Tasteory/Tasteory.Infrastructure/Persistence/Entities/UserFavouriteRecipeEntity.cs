namespace Infrastructure.Persistence.Entities;

public class UserFavoriteRecipeEntity
{
    public Guid UserId { get; set; }
    public UserEntity User { get; set; }
    public Guid RecipeId { get; set; }
    public RecipeEntity Recipe { get; set; }
    public DateTime CreatedAt { get; set; }
}