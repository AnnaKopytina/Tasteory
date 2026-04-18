namespace Domain.Entities;

public class User : Entity
{
    public string UserName { get; private set; }
    public string DisplayName { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public string? AvatarUrl { get; private set; }

    public User(Guid id, string userName, string displayName, string email, string passwordHash) : base(id)
    {
        UserName = userName;
        DisplayName = displayName;
        Email = email;
        PasswordHash = passwordHash;
        AvatarUrl = null;
    }
    
    public void UpdateDisplayName(string name) => DisplayName = name;
    public void UpdateAvatar(string? url) => AvatarUrl = url;
}