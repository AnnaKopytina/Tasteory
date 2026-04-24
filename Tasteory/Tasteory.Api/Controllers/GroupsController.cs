using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Extensions;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groupService;

    public GroupsController(IGroupService groupService)
    {
        _groupService = groupService;
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponse>> Create([FromBody] CreateGroupRequest request)
    {
        var userId = User.GetUserId();

        var groupId = await _groupService.CreateGroupAsync(userId, request.Name);
        var inviteCode = await _groupService.GenerateInviteCodeAsync(userId, groupId);
        var group = await _groupService.GetGroupByIdAsync(groupId);

        var response = new GroupResponse(groupId, group!.Name, inviteCode, group.OwnerName, group.MembersCount);

        return StatusCode(201, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> GetById(Guid id)
    {
        var group = await _groupService.GetGroupByIdAsync(id);

        if (group is null)
        {
            return NotFound();
        }

        var response = new GroupResponse(
            group.Id,
            group.Name,
            group.InviteCode ?? "No active code",
            group.OwnerName,
            group.MembersCount);

        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGroupRequest request)
    {
        var userId = User.GetUserId();

        await _groupService.UpdateGroupAsync(userId, id, request.Name);

        return Ok(new { Message = "Group name updated successfully", NewName = request.Name });
    }

    [HttpPost("{id:guid}/invite")]
    public async Task<IActionResult> GenerateInvite(Guid id)
    {
        var userId = User.GetUserId();

        var code = await _groupService.GenerateInviteCodeAsync(userId, id);

        return Ok(new { InviteCode = code });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();

        await _groupService.DeleteGroupAsync(userId, id);

        return NoContent();
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinGroupRequest request)
    {
        var userId = User.GetUserId();

        var groupId = await _groupService.JoinGroupAsync(userId, request.InviteCode);

        return Ok(new { message = "Successfully joined the group!", groupId = groupId });
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<List<GroupMemberResponse>>> GetMembers(Guid id)
    {
        var members = await _groupService.GetGroupMembersAsync(id);

        var response = members
            .Select(m => new GroupMemberResponse(m.UserId, m.UserName, m.GroupRole.ToString()))
            .ToList();

        return Ok(response);
    }

    [HttpDelete("{id:guid}/members/me")]
    public async Task<IActionResult> LeaveGroup(Guid id)
    {
        var userId = User.GetUserId();

        await _groupService.LeaveGroupAsync(userId, id);

        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{memberToKickId:guid}")]
    public async Task<IActionResult> KickMember(Guid id, Guid memberToKickId)
    {
        var userId = User.GetUserId();

        await _groupService.KickMemberAsync(userId, id, memberToKickId);

        return NoContent();
    }

    [HttpGet("{id:guid}/recipes")]
    public async Task<ActionResult<PagedResponse<RecipeSummaryResponse>>> GetGroupRecipes(Guid id, [FromQuery] PaginationQuery query)
    {
        var currentUserId = User.GetUserId();
        
        var result = await _groupService.GetGroupRecipesPagedAsync(id, query, currentUserId);
        
        return Ok(result);
    }

    [HttpPost("{id:guid}/recipes")]
    public async Task<IActionResult> AddRecipeToGroup(Guid id, [FromBody] Guid recipeId)
    {
        var userId = User.GetUserId();

        await _groupService.AddRecipeToGroupAsync(userId, id, recipeId);

        return Ok(new { message = "Recipe successfully added to group", recipeId });
    }
    
    [HttpPost("{id:guid}/members/by-username")]
    public async Task<IActionResult> AddMemberByUsername(Guid id, [FromBody] AddMemberByUserNameRequest request)
    {
        var userId = User.GetUserId();
        
        await _groupService.AddMemberByUsernameAsync(userId, id, request.UserName);
    
        return Ok(new { message = "User successfully added to group", userName = request.UserName });
    }
}