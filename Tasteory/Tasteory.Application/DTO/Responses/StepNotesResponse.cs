namespace Application.DTO.Responses;

public class StepNotesResponse
{
    public Guid StepId { get; set; }
    public NoteResponse? MyPrivateNote { get; set; }
    public List<NoteResponse> GroupNotes { get; set; } = new();
}
