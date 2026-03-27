namespace Domain.Entities;

public class User : Entity
{
    public string UserName { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }

    public User(Guid id, string userName, string email, string passwordHash) : base(id)
    {
        UserName = userName;
        Email = email;
        PasswordHash = passwordHash;
    }
}