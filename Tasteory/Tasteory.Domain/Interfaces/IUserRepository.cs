using Domain.Entities;

namespace Domain.Interfaces;

public interface IUserRepository
{
    public Task<User?> GetByEmailAsync(string email);
    public Task<User?> GetByIdAsync(Guid id);
    public Task AddAsync(User user);
    public Task UpdateAsync(User user, string newUserName);
    public Task RemoveByIdAsync(Guid id);
    public Task<(List<Group>, int TotalCount)> GetUserGroupsAsync(Guid userId, int page, int pageSize);
}