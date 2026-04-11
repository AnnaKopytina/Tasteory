using Application.Interfaces.Repositories;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain.Entities;
using Domain.Models;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class RecipeRepository : IRecipeRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public RecipeRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Guid> CreateRecipeAsync(Recipe recipe)
    {
        var entity = _mapper.Map<RecipeEntity>(recipe);
        
        entity.Ingredients = _mapper.Map<List<IngredientEntity>>(recipe.Ingredients);
        entity.Steps = _mapper.Map<List<StepEntity>>(recipe.Steps);

        await _context.Recipes.AddAsync(entity);
        await _context.SaveChangesAsync();

        return entity.Id;
    }

    public async Task<Recipe?> GetRecipeByIdAsync(Guid id)
    {
        var entity = await _context.Recipes
            .AsNoTracking()
            .Include(r => r.Steps)
            .Include(r => r.Ingredients)
            .FirstOrDefaultAsync(r => r.Id == id);

        return entity is null ? null : _mapper.Map<Recipe>(entity);
    }

    public async Task<Guid?> GetRecipeAuthorIdAsync(Guid recipeId)
    {
        return await _context.Recipes
            .AsNoTracking()
            .Where(r => r.Id == recipeId)
            .Select(r => r.AuthorId)
            .FirstOrDefaultAsync();
    }

    public async Task DeleteRecipeAsync(Guid id)
    {
        var entity = await _context.Recipes.FindAsync(id);
        
        if (entity is not null)
        {
            _context.Recipes.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
    
    public async Task<(List<RecipeSummary> Recipes, int TotalCount)> GetAllPublicAsync(string? searchTerm, int page, int pageSize)
    {
        var query = _context.Recipes
            .AsNoTracking()
            .Where(r => !r.IsPrivate);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(r => r.Title.Contains(searchTerm) || r.MainText!.Contains(searchTerm));
        }

        var totalCount = await query.CountAsync();

        var recipes = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<RecipeSummary>(_mapper.ConfigurationProvider)
            .ToListAsync();

        return (recipes, totalCount);
    }

    public async Task<(List<RecipeSummary> Recipes, int TotalCount)> GetByUserIdAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.Recipes
            .AsNoTracking()
            .Where(r => r.AuthorId == userId);

        var totalCount = await query.CountAsync();

        var recipes = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ProjectTo<RecipeSummary>(_mapper.ConfigurationProvider)
            .ToListAsync();

        return (recipes, totalCount);
    }

    public async Task<List<RecipeSummary>> GetSuggestionsAsync(string searchTerm, int limit = 5)
    {
        return await _context.Recipes
            .AsNoTracking()
            .Where(r => !r.IsPrivate && r.Title.Contains(searchTerm))
            .OrderBy(r => r.Title)
            .Take(limit)
            .ProjectTo<RecipeSummary>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }
    

    public async Task UpdateRecipeAsync(Recipe recipe)
    {
        var existingEntity = await _context.Recipes
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == recipe.Id);

        if (existingEntity == null)
        {
            return;
        }

        _context.Entry(existingEntity).CurrentValues.SetValues(recipe);

        _context.RemoveRange(existingEntity.Ingredients);
        _context.RemoveRange(existingEntity.Steps);

        var newIngredients = _mapper.Map<List<IngredientEntity>>(recipe.Ingredients);
        var newSteps = _mapper.Map<List<StepEntity>>(recipe.Steps);

        _context.AddRange(newIngredients);
        _context.AddRange(newSteps);

        await _context.SaveChangesAsync();
    }
}