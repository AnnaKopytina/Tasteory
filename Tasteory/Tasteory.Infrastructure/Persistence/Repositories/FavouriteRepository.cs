using Application.Interfaces.Repositories;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class FavoriteRepository : IFavoriteRepository
{
    private readonly AppDbContext _context;

    public FavoriteRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Guid userId, Guid recipeId)
    {
        if (await _context.UserFavoriteRecipes.AnyAsync(f => f.UserId == userId && f.RecipeId == recipeId))
        {
            return;
        }

        await _context.UserFavoriteRecipes.AddAsync(new UserFavoriteRecipeEntity
        {
            UserId = userId,
            RecipeId = recipeId,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(Guid userId, Guid recipeId)
    {
        var favourite = await _context.UserFavoriteRecipes
            .FirstOrDefaultAsync(f => f.UserId == userId && f.RecipeId == recipeId);

        if (favourite is not null)
        {
            _context.UserFavoriteRecipes.Remove(favourite);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> IsFavoriteAsync(Guid userId, Guid recipeId)
    {
        return await _context.UserFavoriteRecipes
            .AnyAsync(f => f.UserId == userId && f.RecipeId == recipeId);
    }

    public async Task<List<Guid>> GetUserFavoriteIdsAsync(Guid userId, List<Guid> recipeIds)
    {
        return await _context.UserFavoriteRecipes
            .Where(f => f.UserId == userId && recipeIds.Contains(f.RecipeId))
            .Select(f => f.RecipeId)
            .ToListAsync();
    }
}