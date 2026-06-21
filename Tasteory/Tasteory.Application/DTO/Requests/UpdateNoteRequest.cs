namespace Application.DTO.Requests;

public class UpdateNoteRequest
{
    public Guid StepId { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public Guid? GroupId { get; set; }
}