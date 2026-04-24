using Domain.Enums;

namespace Domain.Entities;

public class Recipe : Entity
{
    public Guid AuthorId { get; private set; }
    public string Title { get; private set; }
    public string? MainImage { get; private set; }
    public string? MainText { get; private set; }
    public decimal Rating { get; private set; }
    public bool IsPrivate { get; private set; }
    public int TimeMinutes { get; private set; }
    public int BasePortions { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string[] Tags { get; private set; }
    public int FavoritesCount { get; private set; }

    private readonly List<Ingredient> _ingredients = new();
    public IReadOnlyCollection<Ingredient> Ingredients => _ingredients.AsReadOnly();

    private readonly List<Step> _steps = new();
    public IReadOnlyCollection<Step> Steps => _steps.AsReadOnly();
    

    public Recipe(Guid id, Guid authorId, string title, string? mainImage, string? mainText,
        decimal rating, bool isPrivate, int timeMinutes, int basePortions,
        DateTime createdAt, string[] tags, int favoritesCount, IEnumerable<Ingredient>? ingredients = null,
        IEnumerable<Step>? steps = null) : base(id)
    {
        AuthorId = authorId;
        Title = title;
        MainImage = mainImage;
        MainText = mainText;
        Rating = rating;
        IsPrivate = isPrivate;
        TimeMinutes = timeMinutes;
        BasePortions = basePortions;
        CreatedAt = createdAt;
        Tags = tags;
        FavoritesCount = favoritesCount;

        if (ingredients is not null)
        {
            _ingredients.AddRange(ingredients);
        }

        if (steps is not null)
        {
            _steps.AddRange(steps);
        }
    }

    public static Recipe CreateNew(
        Guid authorId,
        string title,
        string? mainImage,
        string? mainText,
        bool isPrivate,
        int timeMinutes,
        int basePortions,
        string[] tags)
    {
        return new Recipe(
            Guid.NewGuid(),
            authorId,
            title,
            mainImage,
            mainText,
            0,
            isPrivate,
            timeMinutes,
            basePortions,
            DateTime.UtcNow,
            tags,
            0);
    }

    public void AddIngredient(string name, decimal amount, string? measure, string? section, int sortOrder)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Ingredient name is required.");
        }

        var ingredient = new Ingredient(Guid.NewGuid(), Id, name, amount, measure, section, sortOrder);
        _ingredients.Add(ingredient);
    }

    public void AddStep(string content, int sortOrder, string? mediaUrl, MediaType? mediaType)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Step content is required.");
        }

        if (sortOrder <= 0)
        {
            throw new ArgumentException("Sort order must be positive.");
        }

        if (_steps.Any(s => s.SortOrder == sortOrder))
        {
            throw new InvalidOperationException($"Step with sort order {sortOrder} already exists.");
        }

        var step = new Step(Guid.NewGuid(), Id, sortOrder, content, mediaUrl, mediaType);
        _steps.Add(step);
    }
    
    public void UpdateMainInfo(string title, string? mainImage, string? mainText, bool isPrivate, int timeMinutes, int basePortions, string[] tags)
    {
        Title = title;
        MainImage = mainImage;
        MainText = mainText;
        IsPrivate = isPrivate;
        TimeMinutes = timeMinutes;
        BasePortions = basePortions;
        Tags = tags;
    }

    public void ClearIngredients() => _ingredients.Clear();
    
    public void ClearSteps() => _steps.Clear();
}