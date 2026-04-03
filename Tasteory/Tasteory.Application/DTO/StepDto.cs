namespace Application.DTO;

public record StepDto(
    Guid Id, 
    int Order, 
    MediaFieldDto Field, 
    string Text, 
    string? MyPrivateNote, 
    string? GroupNote);