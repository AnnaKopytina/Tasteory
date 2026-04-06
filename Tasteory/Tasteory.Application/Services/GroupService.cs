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

    public GroupService(IGroupRepository groupRepository)
    {
        _groupRepository = groupRepository;
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
}