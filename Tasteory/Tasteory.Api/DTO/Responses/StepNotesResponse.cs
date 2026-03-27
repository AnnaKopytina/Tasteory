namespace Tasteory.Api.DTOs;

public record StepNotesResponse(
    Guid StepId,
    string? MyPrivateNote,
    string? FamilyNote
);