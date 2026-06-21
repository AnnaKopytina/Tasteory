namespace Domain.Entities;

public class Ingredient : Entity
{
    public Guid RecipeId { get; private set; }
    public string Name { get; private set; }
    public decimal Amount { get; private set; }
    public string? Measure { get; private set; }
    public string? Section { get; private set; }
    public int SortOrder { get; private set; }

    public Ingredient(
        Guid id,
        Guid recipeId,
        string name,
        decimal amount,
        string? measure,
        string? section,
        int sortOrder)
        : base(id)
    {
        RecipeId = recipeId;
        Name = name;
        Amount = amount;
        Measure = measure;
        Section = section;
        SortOrder = sortOrder;
    }
}