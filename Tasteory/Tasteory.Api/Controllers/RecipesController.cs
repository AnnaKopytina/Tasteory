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

    public RecipesController(IRecipeService recipeService)
    {
        _recipeService = recipeService;
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
    public async Task<ActionResult<RecipeResponse>> GetById(Guid id)
    {
        var recipeResponse = await _recipeService.GetRecipeByIdAsync(id);

        if (recipeResponse is null)
        {
            return NotFound();
        }

        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : Guid.Empty;

        if (recipeResponse.IsPrivate && recipeResponse.AuthorId != currentUserId)
        {
            return Forbid();
        }

        return Ok(recipeResponse);
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
    public async Task<ActionResult<PagedResponse<RecipeSummaryResponse>>> GetAll(
        [FromQuery] PaginationQuery query,
        [FromQuery] string? searchTerm = null)
    {
        var (recipes, totalCount) = await _recipeService.GetAllPublicAsync(searchTerm, query);

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
        var (recipes, totalCount) = await _recipeService.GetByUserIdAsync(userId, query);

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