using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;

namespace Application.Services;

public class RecipeService : IRecipeService
{
    private readonly IRecipeRepository _recipeRepository;
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;

    public RecipeService(IRecipeRepository recipeRepository, IUserService userService, IUserRepository userRepository,
        IMapper mapper)
    {
        _recipeRepository = recipeRepository;
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

        return await _recipeRepository.CreateRecipeAsync(recipe);
    }

    public async Task<RecipeResponse?> GetRecipeByIdAsync(Guid recipeId)
    {
        var recipe = await _recipeRepository.GetRecipeByIdAsync(recipeId);

        if (recipe is null)
        {
            return null;
        }

        var author = await _userService.GetUserByIdAsync(recipe.AuthorId);
        var authorName = author?.UserName ?? "Unknown Author";

        var response = _mapper.Map<RecipeResponse>(recipe);
        response.AuthorName = authorName;

        return response;
    }

    public async Task DeleteRecipeAsync(Guid authorId, Guid recipeId)
    {
        var actualAuthorId = await _recipeRepository.GetRecipeAuthorIdAsync(recipeId);

        if (actualAuthorId is null)
        {
            throw new NotFoundException("Recipe not found.");
        }

        if (actualAuthorId != authorId)
        {
            throw new ForbiddenException("You can only delete your own recipes.");
        }

        await _recipeRepository.DeleteRecipeAsync(recipeId);
    }

    public async Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetAllPublicAsync(string? searchTerm,
        PaginationQuery query)
    {
        var (summaries, totalCount) = await _recipeRepository.GetAllPublicAsync(searchTerm, query.Page, query.PageSize);

        if (summaries.Count == 0)
        {
            return (new List<RecipeSummaryResponse>(), 0);
        }

        var authorIds = summaries.Select(s => s.AuthorId).Distinct().ToList();

        var authorNames = await _userRepository.GetUserNamesByIdsAsync(authorIds);

        var responses = summaries.Select(s => new RecipeSummaryResponse(
            s.Id,
            s.Title,
            s.MainImage,
            s.MainText,
            s.AuthorId,
            authorNames.GetValueOrDefault(s.AuthorId, "Unknown author"),
            s.Rating,
            s.IsPrivate,
            s.TimeMinutes,
            s.Tags.ToList()
        )).ToList();

        return (responses, totalCount);
    }

    public async Task<(List<RecipeSummaryResponse> Recipes, int TotalCount)> GetByUserIdAsync(Guid userId,
        PaginationQuery query)
    {
        var (summaries, totalCount) = await _recipeRepository.GetByUserIdAsync(userId, query.Page, query.PageSize);

        if (summaries.Count == 0)
        {
            return (new List<RecipeSummaryResponse>(), 0);
        }

        var author = await _userRepository.GetByIdAsync(userId);
        var authorName = author?.UserName ?? "Unknown author";

        var responses = summaries.Select(s => new RecipeSummaryResponse(
            s.Id,
            s.Title,
            s.MainImage,
            s.MainText,
            s.AuthorId,
            authorName,
            s.Rating,
            s.IsPrivate,
            s.TimeMinutes,
            s.Tags.ToList()
        )).ToList();

        return (responses, totalCount);
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
        {
            throw new NotFoundException("Recipe not found.");
        }

        if (recipe.AuthorId != authorId)
        {
            throw new ForbiddenException("You can edit only your recipes.");
        }

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
    }
}