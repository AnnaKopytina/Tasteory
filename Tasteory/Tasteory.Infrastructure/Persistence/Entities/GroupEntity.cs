namespace Infrastructure.Persistence.Entities;

public class GroupEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid OwnerId { get; set; }
    public UserEntity Owner { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<UserGroupEntity> Users { get; set; } = new List<UserGroupEntity>();
    public ICollection<GroupRecipeEntity> Recipes { get; set; } = new List<GroupRecipeEntity>();
    public ICollection<GroupInviteEntity> Invites { get; set; } = new List<GroupInviteEntity>();
}