using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Domain.Entities;

namespace Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _userRepository.GetByIdAsync(userId);
    }

    public async Task<User?> UpdateUserAsync(Guid userId, string? newDisplayName, string? newAvatarUrl)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user is null)
        {
            return null;
        }

        if (newDisplayName is not null)
        {
            user.UpdateDisplayName(newDisplayName);
        }

        if (newAvatarUrl is not null)
        {
            newAvatarUrl = string.IsNullOrWhiteSpace(newAvatarUrl) ? null : newAvatarUrl;
            user.UpdateAvatar(newAvatarUrl);
        }

        await _userRepository.UpdateAsync(user);
        return user;
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        await _userRepository.RemoveByIdAsync(userId);
    }

    public async Task<(List<Group> Groups, int TotalCount)> GetUserGroupsAsync(Guid userId, int page, int pageSize)
    {
        return await _userRepository.GetUserGroupsAsync(userId, page, pageSize);
    }
}