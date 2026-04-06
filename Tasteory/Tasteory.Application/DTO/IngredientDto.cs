namespace Application.DTO;

public class IngredientDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public string? Measure { get; init; }
    public string? Section { get; init; }
    public int SortOrder { get; init; }
}