using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Extensions;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IRecipeService _recipeService;

    public UsersController(IUserService userService, IRecipeService recipeService)
    {
        _userService = userService;
        _recipeService = recipeService;
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

        return Ok(new UserResponse(user.Id, user.Email, user.DisplayName, user.UserName, user.AvatarUrl));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserResponse>> UpdateMe([FromBody] UpdateUserRequest request)
    {
        var userId = User.GetUserId();
        var updatedUser = await _userService.UpdateUserAsync(userId, request.DisplayName, request.AvatarUrl);
        
        if (updatedUser is null)
        {
            return NotFound();
        }

        return Ok(new UserResponse(updatedUser.Id, updatedUser.Email, updatedUser.DisplayName, updatedUser.UserName, updatedUser.AvatarUrl));
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
    public async Task<ActionResult<List<GroupResponse>>> GetMyGroups([FromQuery] PaginationQuery query)
    {
        var userId = User.GetUserId();

        var (groups, totalCount) = await _userService.GetUserGroupsAsync(userId, query.Page, query.PageSize);

        var groupResponses = groups
            .Select(g => new GroupResponse(g.Id, g.Name, g.InviteCode ?? "No active code", g.OwnerName, g.MembersCount))
            .ToList();

        return Ok(new PagedResponse<GroupResponse>
        {
            Items = groupResponses,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }
    
    [HttpGet("me/favorites")]
    [Authorize]
    public async Task<ActionResult<PagedResponse<RecipeSummaryResponse>>> GetMyFavorites([FromQuery] PaginationQuery query)
    {
        var (recipes, totalCount) = await _recipeService.GetFavoritesByUserAsync(User.GetUserId(), query);
        return Ok(new PagedResponse<RecipeSummaryResponse> { Items = recipes, TotalCount = totalCount, Page = query.Page, PageSize = query.PageSize });
    }
}