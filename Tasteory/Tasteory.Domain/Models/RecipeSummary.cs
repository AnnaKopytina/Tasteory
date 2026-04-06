namespace Domain.Models;

public class RecipeSummary
{
    public Guid Id { get; private set; }
    public string Title { get; private set; }
    public string? MainImage { get; private set; }
    public string? MainText { get; private set; }
    public Guid AuthorId { get; private set; }
    public decimal Rating { get; private set; }
    public bool IsPrivate { get; private set; }
    public int TimeMinutes { get; private set; }
    public string[] Tags { get; private set; }

    public RecipeSummary(Guid id, string title, string? mainImage, string? mainText, Guid authorId,
        decimal rating, bool isPrivate, int timeMinutes, string[] tags)
    {
        Id = id;
        Title = title;
        MainImage = mainImage;
        MainText = mainText;
        AuthorId = authorId;
        Rating = rating;
        IsPrivate = isPrivate;
        TimeMinutes = timeMinutes;
        Tags = tags;
    }
}