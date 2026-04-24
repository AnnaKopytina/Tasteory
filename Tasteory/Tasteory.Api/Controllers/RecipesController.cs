using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Extensions;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/recipes")]
[Authorize]
public class RecipesController : ControllerBase
{
    private readonly IRecipeService _recipeService;
    private readonly IGroupService _groupService;

    public RecipesController(IRecipeService recipeService, IGroupService groupService)
    {
        _recipeService = recipeService;
        _groupService = groupService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRecipeRequest request)
    {
        var authorId = User.GetUserId();
        var recipeId = await _recipeService.CreateRecipeAsync(authorId, request);

        return StatusCode(201, new { id = recipeId });
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<RecipeResponse>> GetById(Guid id, [FromQuery] Guid? groupId = null)
    {
        var currentUserId = User.GetUserId();
        var recipeResponse = await _recipeService.GetRecipeByIdAsync(id, currentUserId);

        if (recipeResponse is null)
        {
            return NotFound();
        }

        if (!recipeResponse.IsPrivate || recipeResponse.AuthorId == currentUserId)
        {
            return Ok(recipeResponse);
        }
        
        var hasAccess = await _groupService.HasUserAccessToRecipeAsync(currentUserId, id);
        if (hasAccess)
        {
            return Ok(recipeResponse);
        }

        return Forbid();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var authorId = User.GetUserId();

        await _recipeService.DeleteRecipeAsync(authorId, id);

        return NoContent();
    }

    [HttpGet("suggest")]
    [AllowAnonymous]
    public async Task<ActionResult<List<RecipeSuggestionResponse>>> GetSuggestions([FromQuery] string query)
    {
        var suggestions = await _recipeService.GetSuggestionsAsync(query);
        return Ok(suggestions);
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<RecipeSummaryResponse>>> GetAll([FromQuery] PaginationQuery query,
        [FromQuery] string? searchTerm = null)
    {
        var currentUserId = User.GetUserId();

        var (recipes, totalCount) = await _recipeService.GetAllPublicAsync(searchTerm, query, currentUserId);

        return Ok(new PagedResponse<RecipeSummaryResponse>
        {
            Items = recipes,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<RecipeSummaryResponse>>> GetByUserId(
        Guid userId,
        [FromQuery] PaginationQuery query)
    {
        var currentUserId = User.GetUserId();

        var (recipes, totalCount) = await _recipeService.GetByUserIdAsync(userId, query, currentUserId);

        return Ok(new PagedResponse<RecipeSummaryResponse>
        {
            Items = recipes,
            TotalCount = totalCount,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateRecipeRequest request)
    {
        var authorId = User.GetUserId();

        await _recipeService.UpdateRecipeAsync(authorId, id, request);

        return NoContent();
    }
}