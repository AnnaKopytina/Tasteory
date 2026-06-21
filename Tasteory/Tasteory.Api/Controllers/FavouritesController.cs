using Application.Interfaces.Repositories;
using Application.Metrics;
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
        TasteoryMetrics.FavoritesCurrent.Inc();
        await _favoriteRepository.AddAsync(User.GetUserId(), recipeId);
        
        return Ok();
    }

    [HttpDelete("{recipeId:guid}")]
    public async Task<IActionResult> Remove(Guid recipeId)
    {
        TasteoryMetrics.FavoritesCurrent.Dec();
        await _favoriteRepository.RemoveAsync(User.GetUserId(), recipeId);
        
        return NoContent();
    }
}