using Application.Interfaces.Repositories;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain.Entities;
using Domain.Models;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using GroupRole = Domain.Enums.GroupRole;

namespace Infrastructure.Persistence.Repositories;

public class GroupRepository : IGroupRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public GroupRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Guid> CreateGroupAsync(Guid ownerId, string name)
    {
        var groupId = Guid.NewGuid();

        await _context.Groups.AddAsync(new GroupEntity
        {
            Id = groupId,
            Name = name,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.UserGroups.AddAsync(new UserGroupEntity
        {
            UserId = ownerId,
            GroupId = groupId,
            Role = GroupRole.Owner
        });

        await _context.SaveChangesAsync();

        return groupId;
    }

    public async Task<Group?> GetGroupByIdAsync(Guid id)
    {
        return await _context.Groups
            .AsNoTracking()
            .Where(g => g.Id == id)
            .ProjectTo<Group>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task DeleteGroupAsync(Guid groupId)
    {
        var groupEntity = await _context.Groups
            .Where(g => g.Id == groupId)
            .FirstOrDefaultAsync();

        if (groupEntity is not null)
        {
            _context.Groups.Remove(groupEntity);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<GroupInvite?> GetActiveInviteAsync(Guid groupId)
    {
        return await _context.GroupInvites
            .AsNoTracking()
            .Where(i => i.GroupId == groupId && i.ExpiresAt > DateTime.UtcNow)
            .ProjectTo<GroupInvite>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<string> CreateInviteAsync(GroupInvite invite)
    {
        var groupInviteEntity = _mapper.Map<GroupInviteEntity>(invite);
        await _context.GroupInvites.AddAsync(groupInviteEntity);
        await _context.SaveChangesAsync();

        return groupInviteEntity.Code;
    }

    public async Task<GroupInvite?> GetInviteByCodeAsync(string code)
    {
        return await _context.GroupInvites
            .AsNoTracking()
            .Where(i => i.Code == code)
            .ProjectTo<GroupInvite>(_mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<GroupRole?> GetUserRoleInGroupAsync(Guid userId, Guid groupId)
    {
        return await _context.UserGroups
            .AsNoTracking()
            .Where(ug => ug.UserId == userId && ug.GroupId == groupId)
            .Select(ug => (GroupRole?)ug.Role)
            .FirstOrDefaultAsync();
    }

    public async Task<List<GroupMember>> GetGroupMembersAsync(Guid groupId)
    {
        return await _context.UserGroups
            .AsNoTracking()
            .Where(ug => ug.GroupId == groupId)
            .ProjectTo<GroupMember>(_mapper.ConfigurationProvider).ToListAsync();
    }

    public async Task<bool> IsUserInGroupAsync(Guid userId, Guid groupId)
    {
        return await _context.UserGroups
            .AnyAsync(ug => ug.UserId == userId && ug.GroupId == groupId);
    }

    public async Task AddUserToGroupAsync(Guid userId, Guid groupId, GroupRole groupRole)
    {
        await _context.UserGroups.AddAsync(new UserGroupEntity
        {
            UserId = userId,
            GroupId = groupId,
            Role = groupRole
        });

        await _context.SaveChangesAsync();
    }

    public async Task RemoveUserFromGroupAsync(Guid userId, Guid groupId)
    {
        var userGroup = await _context.UserGroups
            .Where(ug => ug.UserId == userId && ug.GroupId == groupId)
            .FirstOrDefaultAsync();

        if (userGroup is not null)
        {
            _context.UserGroups.Remove(userGroup);
            await _context.SaveChangesAsync();
        }
    }

    public async Task UpdateGroupNameAsync(Guid groupId, string newName)
    {
        var groupEntity = await _context.Groups.FindAsync(groupId);

        if (groupEntity is not null)
        {
            groupEntity.Name = newName;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsInviteCodeExistsAsync(string code)
    {
        return await _context.GroupInvites
            .AnyAsync(i => i.Code == code);
    }

    public async Task<(List<RecipeSummary> Items, int TotalCount)> GetGroupRecipesPagedAsync(Guid groupId, int page, int pageSize)
    {
        var query = _context.Recipes
            .AsNoTracking()
            .Where(r => _context.GroupRecipes.Any(gr => gr.GroupId == groupId && gr.RecipeId == r.Id));

        var totalCount = await query.CountAsync();

        if (totalCount == 0)
        {
            return (new List<RecipeSummary>(), 0);
        }
        
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<RecipeSummary>(_mapper.ConfigurationProvider)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<bool> IsRecipeInGroupAsync(Guid groupId, Guid recipeId)
    {
        return await _context.GroupRecipes
            .AnyAsync(gr => gr.GroupId == groupId && gr.RecipeId == recipeId);
    }

    public async Task AddRecipeToGroupAsync(Guid groupId, Guid recipeId)
    {
        await _context.GroupRecipes.AddAsync(new GroupRecipeEntity
        {
            GroupId = groupId,
            RecipeId = recipeId
        });

        await _context.SaveChangesAsync();
    }
}