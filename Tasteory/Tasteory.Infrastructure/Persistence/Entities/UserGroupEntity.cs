namespace Infrastructure.Persistence.Entities;

public class UserGroupEntity
{
    public Guid UserId { get; set; }
    public UserEntity User { get; set; }
    public Guid GroupId { get; set; }
    public GroupEntity Group { get; set; }
    public GroupRole Role { get; set; }
}