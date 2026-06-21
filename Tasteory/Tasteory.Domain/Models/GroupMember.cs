using Domain.Enums;

namespace Domain.Models;

public class GroupMember
{
    public Guid UserId { get; private set; }
    public string UserName { get; private set; }
    public GroupRole GroupRole { get; private set; }

    public GroupMember(Guid userId, string userName, GroupRole groupRole)
    {
        UserId = userId;
        UserName = userName;
        GroupRole = groupRole;
    }
}