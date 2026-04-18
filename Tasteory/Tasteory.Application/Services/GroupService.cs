using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Models;

namespace Application.Services;

public class GroupService : IGroupService
{
    private readonly IGroupRepository _groupRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRecipeRepository _recipeRepository;

    public GroupService(IGroupRepository groupRepository, IUserRepository userRepository,
        IRecipeRepository recipeRepository)
    {
        _groupRepository = groupRepository;
        _userRepository = userRepository;
        _recipeRepository = recipeRepository;
    }

    public async Task<Guid> CreateGroupAsync(Guid userId, string name)
    {
        return await _groupRepository.CreateGroupAsync(userId, name);
    }

    public async Task<string> GenerateInviteCodeAsync(Guid userId, Guid groupId)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId);

        if (role != GroupRole.Owner)
        {
            throw new ForbiddenException("Only the group owner can generate invite codes.");
        }

        var existingInvite = await _groupRepository.GetActiveInviteAsync(groupId);

        if (existingInvite is not null)
        {
            return existingInvite.Code;
        }

        var newInvite = GroupInvite.CreateNew(groupId);
        var attempts = 1;
        const int maxAttempts = 10;

        while (await _groupRepository.IsInviteCodeExistsAsync(newInvite.Code))
        {
            if (attempts >= maxAttempts)
            {
                throw new InvalidOperationException("System could not generate a unique invite code.");
            }

            newInvite = GroupInvite.CreateNew(groupId);
            attempts++;
        }

        return await _groupRepository.CreateInviteAsync(newInvite);
    }

    public async Task<Guid> JoinGroupAsync(Guid userId, string inviteCode)
    {
        var invite = await _groupRepository.GetInviteByCodeAsync(inviteCode);

        if (invite is null || invite.ExpiresAt < DateTime.UtcNow)
        {
            throw new BadRequestException("Invite code is invalid or expired");
        }

        var isMember = await _groupRepository.IsUserInGroupAsync(userId, invite.GroupId);

        if (isMember)
        {
            throw new AlreadyExistsException("You are already a member of this group.");
        }

        await _groupRepository.AddUserToGroupAsync(userId, invite.GroupId, GroupRole.Member);

        return invite.GroupId;
    }

    public async Task DeleteGroupAsync(Guid userId, Guid groupId)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId);

        if (role != GroupRole.Owner)
        {
            throw new ForbiddenException("Only the owner can delete the group.");
        }

        await _groupRepository.DeleteGroupAsync(groupId);
    }

    public async Task<List<GroupMember>> GetGroupMembersAsync(Guid groupId)
    {
        return await _groupRepository.GetGroupMembersAsync(groupId);
    }

    public async Task LeaveGroupAsync(Guid userId, Guid groupId)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId);

        if (role is null)
        {
            throw new NotFoundException("You are not a member of this group.");
        }

        if (role == GroupRole.Owner)
        {
            throw new BadRequestException("The owner cannot leave the group. Delete the group.");
        }

        await _groupRepository.RemoveUserFromGroupAsync(userId, groupId);
    }

    public async Task KickMemberAsync(Guid ownerId, Guid groupId, Guid memberToKickId)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(ownerId, groupId);
        if (role != GroupRole.Owner)
        {
            throw new ForbiddenException("Only the owner can kick members.");
        }

        if (ownerId == memberToKickId)
        {
            throw new BadRequestException("The owner cannot kick themselves.");
        }

        await _groupRepository.RemoveUserFromGroupAsync(memberToKickId, groupId);
    }

    public async Task<Group?> GetGroupByIdAsync(Guid groupId)
    {
        return await _groupRepository.GetGroupByIdAsync(groupId);
    }

    public async Task UpdateGroupAsync(Guid userId, Guid groupId, string newName)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId);

        if (role != GroupRole.Owner)
        {
            throw new ForbiddenException("Only the group owner can update the group.");
        }

        await _groupRepository.UpdateGroupNameAsync(groupId, newName);
    }

    public async Task<PagedResponse<RecipeSummaryResponse>> GetGroupRecipesPagedAsync(Guid groupId,
        PaginationQuery query)
    {
        var (summaries, totalCount) =
            await _groupRepository.GetGroupRecipesPagedAsync(groupId, query.Page, query.PageSize);

        if (summaries.Count == 0)
        {
            return new PagedResponse<RecipeSummaryResponse>
            {
                Items = new List<RecipeSummaryResponse>(),
                TotalCount = 0,
                Page = query.Page,
                PageSize = query.PageSize
            };
        }

        var authorIds = summaries.Select(s => s.AuthorId).Distinct().ToList();
        var authorNames = await _userRepository.GetUserNamesByIdsAsync(authorIds);

        var responses = summaries.Select(s => new RecipeSummaryResponse(
            s.Id,
            s.Title,
            s.MainImage,
            s.MainText,
            s.AuthorId,
            authorNames.GetValueOrDefault(s.AuthorId, "Unknown author"),
            s.Rating,
            s.IsPrivate,
            s.TimeMinutes,
            s.Tags.ToList()
        )).ToList();

        return new PagedResponse<RecipeSummaryResponse>
        {
            Items = responses,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    public async Task AddRecipeToGroupAsync(Guid userId, Guid groupId, Guid recipeId)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId);
        
        if (role is null)
        {
            throw new NotFoundException("You are not a member of this group.");
        }

        var recipe = await _recipeRepository.GetRecipeByIdAsync(recipeId);
        if (recipe is null)
        {
            throw new NotFoundException("Recipe is not found.");
        }

        if (recipe.IsPrivate && recipe.AuthorId != userId)
        {
            throw new ForbiddenException("You can't add someone else's private recipe to a group.");
        }

        var alreadyInGroup = await _groupRepository.IsRecipeInGroupAsync(groupId, recipeId);
        
        if (alreadyInGroup)
        {
            throw new AlreadyExistsException("Recipe is already in this group.");
        }

        await _groupRepository.AddRecipeToGroupAsync(groupId, recipeId);
    }
    
    public async Task AddMemberByUsernameAsync(Guid currentUserId, Guid groupId, string userName)
    {
        var role = await _groupRepository.GetUserRoleInGroupAsync(currentUserId, groupId);
        var cleanUsername = userName.TrimStart('@').Trim();

        if (role != GroupRole.Owner)
        {
            throw new ForbiddenException("Only the group owner can add members.");
        }

        var targetUser = await _userRepository.GetByUsernameAsync(cleanUsername);
        
        if (targetUser is null)
        {
            throw new NotFoundException($"User @{cleanUsername} not found.");
        }

        if (targetUser.Id == currentUserId)
        {
            throw new BadRequestException("You cannot add yourself to the group.");
        }
        
        var isMember = await _groupRepository.IsUserInGroupAsync(targetUser.Id, groupId);
        
        if (isMember)
        {
            throw new AlreadyExistsException("User is already a member of this group.");
        }

        await _groupRepository.AddUserToGroupAsync(targetUser.Id, groupId, GroupRole.Member);
    }
}