namespace Infrastructure.Persistence.Entities;

public class UserEntity
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public ICollection<RecipeEntity> CreatedRecipes { get; set; } = new List<RecipeEntity>();
    public ICollection<UserGroupEntity> UserGroups { get; set; } = new List<UserGroupEntity>();
    public ICollection<GroupEntity> OwnedGroups { get; set; } = new List<GroupEntity>();
    public ICollection<UserFavoriteRecipeEntity> FavoriteRecipes { get; set; } = new List<UserFavoriteRecipeEntity>();

}