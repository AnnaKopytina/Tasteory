namespace Infrastructure.Persistence.Entities;

public class GroupInviteEntity
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public GroupEntity Group { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}