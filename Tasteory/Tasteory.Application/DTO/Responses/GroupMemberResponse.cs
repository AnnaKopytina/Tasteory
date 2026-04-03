namespace Application.DTO.Responses;

public record GroupMemberResponse(
    string Name, 
    string Role); // "Owner" или "Member"