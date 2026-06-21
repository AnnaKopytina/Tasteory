namespace Domain.Entities;

public class GroupInvite : Entity
{
    public Guid GroupId { get; private set; }
    public string Code { get; private set; }
    public DateTime ExpiresAt { get; private set; }

    public GroupInvite(Guid id, Guid groupId, string code, DateTime expiresAt) : base(id)
    {
        GroupId = groupId;
        Code = code;
        ExpiresAt = expiresAt;
    }

    public static GroupInvite CreateNew(Guid groupId, int expirationDays = 7)
    {
        var code = Guid.NewGuid().ToString("N")[..7].ToUpper();
        var expiresAt = DateTime.UtcNow.AddDays(expirationDays);

        return new GroupInvite(Guid.NewGuid(), groupId, code, expiresAt);
    }
}