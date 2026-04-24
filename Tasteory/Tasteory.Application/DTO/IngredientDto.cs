namespace Application.DTO;

public class IngredientDto
{
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Measure { get; set; }
    public string? Section { get; set; }
    public int SortOrder { get; set; }
}