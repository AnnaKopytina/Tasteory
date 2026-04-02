using Domain.Entities;

namespace Application.Interfaces.Services;

public interface IUserService
{
    public Task<User?> GetUserByIdAsync(Guid userId);
    public Task<User?> UpdateUserAsync(Guid userId, string newName);
    public Task DeleteUserAsync(Guid userId);
    public Task<(List<Group> Groups, int TotalCount)> GetUserGroupsAsync(Guid userId, int page, int pageSize);
}