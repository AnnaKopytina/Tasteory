namespace Infrastructure.Persistence.Entities;

public class GroupRecipeEntity
{
    public Guid GroupId { get; set; }
    public GroupEntity Group { get; set; }
    public Guid RecipeId { get; set; }
    public RecipeEntity Recipe { get; set; }
}