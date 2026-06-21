using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Application.Metrics;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Models;

namespace Application.Services;

public class RecipeService : IRecipeService
{
    private readonly IRecipeRepository _recipeRepository;
    private readonly IFavoriteRepository _favoriteRepository;
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public RecipeService(IRecipeRepository recipeRepository, IFavoriteRepository favoriteRepository,
        IUserService userService, IUserRepository userRepository, IMapper mapper)
    {
        _recipeRepository = recipeRepository;
        _favoriteRepository = favoriteRepository;
        _userService = userService;
        _userRepository = userRepository;
        _mapper = mapper;
    }


    public async Task<Guid> CreateRecipeAsync(Guid authorId, CreateRecipeRequest request)
    {
        var recipe = Recipe.CreateNew(authorId, request.Title, request.MainImage, request.MainText,
            request.IsPrivate, request.TimeMinutes, request.BasePortions, request.Tags);

        foreach (var ing in request.Ingredients)
        {
            recipe.AddIngredient(ing.Name, ing.Amount, ing.Measure, ing.Section, ing.SortOrder);
        }

        foreach (var step in request.Steps)
        {
            MediaType? mediaType = null;
            if (!string.IsNullOrWhiteSpace(step.MediaType) &&
                Enum.TryParse<MediaType>(step.MediaType, true, out var parsedType))
            {
                mediaType = parsedType;
            }

            recipe.AddStep(step.Content, step.SortOrder, step.MediaUrl, mediaType);
        }

        var id = await _recipeRepository.CreateRecipeAsync(recipe);

        var visibility = request.IsPrivate ? "private" : "public";
        TasteoryMetrics.RecipesCurrent.WithLabels(visibility, "personal").Inc();

        return id;
    }

    public async Task<RecipeResponse?> GetRecipeByIdAsync(Guid recipeId, Guid currentUserId)
    {
        var recipe = await _recipeRepository.GetRecipeByIdAsync(recipeId);
        if (recipe is null)
        {
            return null;
        }

        var author = await _userService.GetUserByIdAsync(recipe.AuthorId);
        
        var response = _mapper.Map<RecipeResponse>(recipe);
        response.AuthorName = author?.DisplayName ?? "Unknown Author";

        if (currentUserId != Guid.Empty)
        {
            response.IsFavorite = await _favoriteRepository.IsFavoriteAsync(currentUserId, recipeId);
        }

        return response;
    }


    public async Task DeleteRecipeAsync(Guid authorId, Guid recipeId)
    {
        var recipe = await _recipeRepository.GetRecipeByIdAsync(recipeId);
        var actualAuthorId = await _recipeRepository.GetRecipeAuthorIdAsync(recipeId);

        if (actualAuthorId is null)
        {
            throw new NotFoundException("Recipe not found.");
        }

        if (actualAuthorId != authorId)
        {
            throw new ForbiddenException("You can only delete your own recipes.");
        }
        var visibility = recipe.IsPrivate ? "private" : "public";
        var scope = await _recipeRepository.IsInAnyGroupAsync(recipeId) ? "group" : "personal";
        TasteoryMetrics.RecipesCurrent.WithLabels(visibility, scope).Dec();
        
        await _recipeRepository.DeleteRecipeAsync(recipeId);
    }

    public async Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetAllPublicAsync(
        string? searchTerm, 
        PaginationQuery query, 
        Guid currentUserId)
    {
        var (summaries, totalCount) = await _recipeRepository.GetAllPublicAsync(
            searchTerm, 
            query.Page, 
            query.PageSize, 
            query.Tags); 

        var responses = await MapWithFavorites(summaries, currentUserId);
        return (responses, totalCount);
    }

    public async Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetByUserIdAsync(Guid userId,
        PaginationQuery query, Guid currentUserId)
    {
        var (summaries, totalCount) = await _recipeRepository.GetByUserIdAsync(userId, query.Page, query.PageSize);
        return (await MapWithFavorites(summaries, currentUserId), totalCount);
    }

    public async Task<List<RecipeSuggestionResponse>> GetSuggestionsAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
        {
            return new List<RecipeSuggestionResponse>();
        }

        var suggestions = await _recipeRepository.GetSuggestionsAsync(query, 5);

        return suggestions.Select(s => new RecipeSuggestionResponse(s.Id, s.Title)).ToList();
    }

    public async Task UpdateRecipeAsync(Guid authorId, Guid recipeId, CreateRecipeRequest request)
    {
        var recipe = await _recipeRepository.GetRecipeByIdAsync(recipeId);

        if (recipe is null)
            throw new NotFoundException("Recipe not found.");

        if (recipe.AuthorId != authorId)
            throw new ForbiddenException("You can edit only your recipes.");
        
        var oldVisibility = recipe.IsPrivate ? "private" : "public";
        var oldScope = await _recipeRepository.IsInAnyGroupAsync(recipeId) ? "group" : "personal";
        TasteoryMetrics.RecipesCurrent.WithLabels(oldVisibility, oldScope).Dec();
        
        recipe.UpdateMainInfo(request.Title, request.MainImage, request.MainText,
            request.IsPrivate, request.TimeMinutes, request.BasePortions, request.Tags);

        recipe.ClearIngredients();
        foreach (var ingredient in request.Ingredients)
        {
            recipe.AddIngredient(ingredient.Name, ingredient.Amount, ingredient.Measure, ingredient.Section,
                ingredient.SortOrder);
        }

        recipe.ClearSteps();
        foreach (var step in request.Steps)
        {
            MediaType? mediaType = null;
            if (!string.IsNullOrWhiteSpace(step.MediaType) &&
                Enum.TryParse<MediaType>(step.MediaType, true, out var parsedType))
            {
                mediaType = parsedType;
            }

            recipe.AddStep(step.Content, step.SortOrder, step.MediaUrl, mediaType);
        }

        await _recipeRepository.UpdateRecipeAsync(recipe);
        var newVisibility = request.IsPrivate ? "private" : "public";
        TasteoryMetrics.RecipesCurrent.WithLabels(newVisibility, oldScope).Inc();
    }

    public async Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetFavoritesByUserAsync(Guid userId,
        PaginationQuery query)
    {
        var (summaries, totalCount) =
            await _recipeRepository.GetFavoritesByUserIdAsync(userId, query.Page, query.PageSize);
        return (await MapWithFavorites(summaries, userId), totalCount);
    }

    private async Task<List<RecipeSummaryResponse>> MapWithFavorites(List<RecipeSummary> summaries, Guid userId)
    {
        if (summaries.Count == 0)
        {
            return new List<RecipeSummaryResponse>();
        }

        var recipeIds = summaries.Select(s => s.Id).ToList();
        var authorIds = summaries.Select(s => s.AuthorId).Distinct().ToList();

        var authorNames = await _userRepository.GetUserNamesByIdsAsync(authorIds);

        var favoriteIds = userId != Guid.Empty
            ? await _favoriteRepository.GetUserFavoriteIdsAsync(userId, recipeIds)
            : new List<Guid>();

        return summaries.Select(s => new RecipeSummaryResponse(
            s.Id,
            s.Title,
            s.MainImage,
            s.MainText,
            s.AuthorId,
            authorNames.GetValueOrDefault(s.AuthorId, "Unknown author"),
            s.Rating,
            s.IsPrivate,
            s.TimeMinutes,
            s.Tags.ToList(),
            favoriteIds.Contains(s.Id),
            s.FavoritesCount
        )).ToList();
    }
}