namespace Application.Interfaces.Services;

public interface IAuthService
{
    public Task RegisterAsync(string displayName, string username, string email, string password);
    public Task<string> LoginAsync(string email, string password);
}