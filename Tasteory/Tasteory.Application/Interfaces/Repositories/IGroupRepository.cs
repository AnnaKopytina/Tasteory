using Domain.Entities;
using Domain.Enums;
using Domain.Models;

namespace Application.Interfaces.Repositories;

public interface IGroupRepository
{
    public Task<Guid> CreateGroupAsync(Guid ownerId, string name);
    public Task<Group?> GetGroupByIdAsync(Guid id);
    public Task DeleteGroupAsync(Guid groupId);

    public Task<GroupInvite?> GetActiveInviteAsync(Guid groupId);
    public Task<string> CreateInviteAsync(GroupInvite invite);
    public Task<GroupInvite?> GetInviteByCodeAsync(string code);

    public Task<GroupRole?> GetUserRoleInGroupAsync(Guid userId, Guid groupId);
    public Task<List<GroupMember>> GetGroupMembersAsync(Guid groupId);

    public Task<bool> IsUserInGroupAsync(Guid userId, Guid groupId);
    public Task AddUserToGroupAsync(Guid userId, Guid groupId, GroupRole groupRole);
    public Task RemoveUserFromGroupAsync(Guid userId, Guid groupId);
    public Task UpdateGroupNameAsync(Guid groupId, string newName);
    public Task<bool> IsInviteCodeExistsAsync(string code);
}