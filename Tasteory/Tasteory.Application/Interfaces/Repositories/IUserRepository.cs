using Domain.Entities;

namespace Application.Interfaces.Repositories;

public interface IUserRepository
{
    public Task<User?> GetByEmailAsync(string email);
    public Task<User?> GetByIdAsync(Guid id);
    public Task<User?> GetByUsernameAsync(string username);
    public Task<bool> UsernameExistsAsync(string username);
    public Task AddAsync(User user);
    public Task UpdateAsync(User user);
    public Task RemoveByIdAsync(Guid id);
    public Task<(List<Group>, int TotalCount)> GetUserGroupsAsync(Guid userId, int page, int pageSize);
    public Task<Dictionary<Guid, string>> GetUserNamesByIdsAsync(IEnumerable<Guid> userIds);
}