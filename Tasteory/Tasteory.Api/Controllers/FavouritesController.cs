using Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Extensions;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteRepository _favoriteRepository;

    public FavoritesController(IFavoriteRepository favoriteRepository)
    {
        _favoriteRepository = favoriteRepository;
    }

    [HttpPost("{recipeId:guid}")]
    public async Task<IActionResult> Add(Guid recipeId)
    {
        await _favoriteRepository.AddAsync(User.GetUserId(), recipeId);
        
        return Ok();
    }

    [HttpDelete("{recipeId:guid}")]
    public async Task<IActionResult> Remove(Guid recipeId)
    {
        await _favoriteRepository.RemoveAsync(User.GetUserId(), recipeId);
        
        return NoContent();
    }
}