using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Api.DTOs;
using Tastory.Extensions;

namespace Tasteory.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    //TODO: Шарахнуть Fluent-Validation
    private IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> GetMe()
    {
        var userId = User.GetUserId();
        var user = await _userService.GetUserByIdAsync(userId);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(new UserResponse(user.Id, user.Email, user.UserName));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateMe([FromBody] UpdateUserRequest request)
    {
        var userId = User.GetUserId();
        var updatedUser = await _userService.UpdateUserAsync(userId, request.Name);

        if (updatedUser is null)
        {
            return NotFound();
        }

        return Ok(new UserResponse(updatedUser.Id, updatedUser.Email, updatedUser.UserName));
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteMe()
    {
        var userId = User.GetUserId();

        await _userService.DeleteUserAsync(userId);

        Response.Cookies.Delete("tasty-auth");

        return NoContent();
    }

    [HttpGet("me/groups")]
    [Authorize]
    public async Task<ActionResult<List<GroupResponse>>> GetMyGroups([FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var userId = User.GetUserId();

        var (groups, totalCount) = await _userService.GetUserGroupsAsync(userId, page, pageSize);

        var groupResponses = groups
            .Select(g => new GroupResponse(g.Id, g.Name, g.InviteCode, g.OwnerName, g.MembersCount))
            .ToList();

        return Ok(new PagedResponse<GroupResponse>
        {
            Items = groupResponses,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }
}