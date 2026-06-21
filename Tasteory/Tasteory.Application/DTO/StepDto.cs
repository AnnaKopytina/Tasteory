namespace Application.DTO;

public class StepDto
{
    public Guid Id { get; init; }
    public int SortOrder { get; init; }
    public string Content { get; init; } = string.Empty;
    public string? MediaUrl { get; init; }
    public string? MediaType { get; init; } 
}