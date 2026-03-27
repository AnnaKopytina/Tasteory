namespace Tasteory.Api.DTOs;

public record UpdateNoteRequest(
    Guid StepId, 
    string Text, 
    bool IsPrivate // true = личная, false = семейная
);