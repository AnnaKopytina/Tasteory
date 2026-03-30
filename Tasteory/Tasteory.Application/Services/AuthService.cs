using Application.Interfaces.Auth;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Interfaces;

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

    public async Task RegisterAsync(string userName, string email, string password)
    {
        var existingUser = await _userRepository.GetByEmailAsync(email);

        if (existingUser is not null)
        {
            throw new AlreadyExistsException("User with the same Email already exists");
        }

        var passwordHash = _passwordHasher.Generate(password);

        var user = new User(Guid.NewGuid(), userName, email, passwordHash);

        await _userRepository.AddAsync(user);
    }

    public async Task<string> LoginAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Invalid Email or Password");
        }

        var isValidPassword = _passwordHasher.Verify(password, user.PasswordHash);

        if (!isValidPassword)
        {
            throw new UnauthorizedAccessException("Invalid Email or Password");
        }

        return _jwtProvider.Generate(user);
    }
}