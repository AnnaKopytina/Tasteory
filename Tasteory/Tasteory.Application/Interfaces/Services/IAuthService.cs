namespace Application.Interfaces.Services;

public interface IAuthService
{
    public Task RegisterAsync(string userName, string email, string password);
    public Task<string> LoginAsync(string email, string password);
}