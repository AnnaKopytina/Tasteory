
using Application.DTO.Requests;
using Application.DTO.Responses;
using Domain.Entities;
using Domain.Models;

namespace Application.Interfaces.Services;

public interface IGroupService
{
    public Task<Guid> CreateGroupAsync(Guid userId, string name);
    public Task<string> GenerateInviteCodeAsync(Guid userId, Guid groupId);
    public Task<Guid> JoinGroupAsync(Guid userId, string inviteCode);
    public Task DeleteGroupAsync(Guid userId, Guid groupId);
    public Task<List<GroupMember>> GetGroupMembersAsync(Guid groupId);
    public Task LeaveGroupAsync(Guid userId, Guid groupId);
    public Task KickMemberAsync(Guid ownerId, Guid groupId, Guid memberToKickId);
    public Task<Group?> GetGroupByIdAsync(Guid groupId);
    public Task UpdateGroupAsync(Guid userId, Guid groupId, string newName);
    public Task<PagedResponse<RecipeSummaryResponse>> GetGroupRecipesPagedAsync(Guid groupId, PaginationQuery query);
    public Task AddRecipeToGroupAsync(Guid userId, Guid groupId, Guid recipeId);
    public Task AddMemberByUsernameAsync(Guid currentUserId, Guid groupId, string userName);
}