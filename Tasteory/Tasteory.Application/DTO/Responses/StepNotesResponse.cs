namespace Application.DTO.Responses;

public record StepNotesResponse(
    Guid StepId,
    string? MyPrivateNote,
    string? FamilyNote
);