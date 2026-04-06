using Application.DTO.Requests;
using Application.DTO.Responses;
using Domain.Entities;

namespace Application.Interfaces.Services;

public interface IRecipeService
{
    public Task<Guid> CreateRecipeAsync(Guid authorId, CreateRecipeRequest request);
    public Task<RecipeResponse?> GetRecipeByIdAsync(Guid recipeId);
    public Task DeleteRecipeAsync(Guid authorId, Guid recipeId);

    public Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetAllPublicAsync(string? searchTerm,
        PaginationQuery query);

    public Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetByUserIdAsync(Guid userId, PaginationQuery query);

    public Task<List<RecipeSuggestionResponse>> GetSuggestionsAsync(string query);
    public Task UpdateRecipeAsync(Guid authorId, Guid recipeId, CreateRecipeRequest request);
}