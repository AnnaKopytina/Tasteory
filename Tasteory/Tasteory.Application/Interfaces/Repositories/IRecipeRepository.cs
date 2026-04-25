using Application.DTO.Responses;
using Domain.Entities;
using Domain.Models;

namespace Application.Interfaces.Repositories;

public interface IRecipeRepository
{
    public Task<Guid> CreateRecipeAsync(Recipe recipe);
    public Task<Recipe?> GetRecipeByIdAsync(Guid id);
    public Task DeleteRecipeAsync(Guid id);
    public Task<Guid?> GetRecipeAuthorIdAsync(Guid recipeId);
    public Task<(List<RecipeSummary> Recipes, int TotalCount)> GetAllPublicAsync(string? searchTerm, int page, int pageSize, string[]? tags = null);
    public Task<(List<RecipeSummary> Recipes, int TotalCount)> GetByUserIdAsync(Guid userId, int page, int pageSize);
    public Task<List<RecipeSummary>> GetSuggestionsAsync(string query, int limit = 5);
    public Task UpdateRecipeAsync(Recipe recipe);
    public Task<(List<RecipeSummary> Items, int TotalCount)> GetFavoritesByUserIdAsync(Guid userId, int page, int pageSize);
}