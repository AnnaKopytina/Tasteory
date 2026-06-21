using Domain.Enums;

namespace Domain.Entities;

public class Step : Entity
{
    public Guid RecipeId { get; private set; }
    public int SortOrder { get; private set; }
    public string Content { get; private set; }
    public string? MediaUrl { get; private set; }
    public MediaType? MediaType { get; private set; }

    public Step(Guid id, Guid recipeId, int sortOrder, string content, string? mediaUrl, MediaType? mediaType) 
        : base(id)
    {
        RecipeId = recipeId;
        SortOrder = sortOrder;
        Content = content;
        MediaUrl = mediaUrl;
        MediaType = mediaType;
    }
}