using Application.Exceptions;
using Application.Interfaces.Auth;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Application.Metrics;
using Domain.Entities;

namespace Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;

    public AuthService(IUserRepository userRepository, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
    }

    public async Task RegisterAsync(string username, string displayName, string email, string password)
    {
        var cleanUsername = username.TrimStart('@').Trim();
        
        if (await _userRepository.GetByEmailAsync(email) is not null)
        {
            throw new AlreadyExistsException("User with the same Email already exists");
        }

        if (await _userRepository.UsernameExistsAsync(cleanUsername))
        {
            throw new AlreadyExistsException($"Username @{username} is already taken");
        }

        var passwordHash = _passwordHasher.Generate(password);
        var user = new User(Guid.NewGuid(), displayName, cleanUsername, email, passwordHash);

        await _userRepository.AddAsync(user);
        
        TasteoryMetrics.UsersRegisteredTotal.Inc(); 
    }

    public async Task<string> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        
        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid Email or Password");
        }
        
        if (!_passwordHasher.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid Email or Password");
        }

        return _jwtProvider.Generate(user);
    }
}