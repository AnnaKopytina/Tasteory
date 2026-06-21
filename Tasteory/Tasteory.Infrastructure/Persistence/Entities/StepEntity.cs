using Domain.Enums;

namespace Infrastructure.Persistence.Entities;

public class StepEntity
{
    public Guid Id { get; set; }
    public Guid RecipeId { get; set; }
    public RecipeEntity Recipe { get; set; }
    public int SortOrder { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? MediaUrl { get; set; }
    public MediaType? MediaType { get; set; }
    public ICollection<StepNoteEntity> Notes { get; set; } = new List<StepNoteEntity>();
}