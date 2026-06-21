namespace Domain.Entities;

public class Group : Entity
{
    public string Name { get; private set; }
    public string OwnerName { get; private set; }
    public string? InviteCode { get; private set; }
    public int MembersCount { get; private set; }

    public Group(Guid id, string name, string ownerName, string? inviteCode, int membersCount) : base(id)
    {
        Name = name;
        OwnerName = ownerName;
        InviteCode = inviteCode;
        MembersCount = membersCount;
    }
}