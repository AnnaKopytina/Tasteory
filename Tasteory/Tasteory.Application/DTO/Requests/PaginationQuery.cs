namespace Application.DTO.Requests;

public class PaginationQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string[]? Tags { get; set; } 
}