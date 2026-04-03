namespace Application.DTO.Requests;

public record UpdateNoteRequest(
    Guid StepId, 
    string Text, 
    bool IsPrivate // true = личная, false = семейная
);