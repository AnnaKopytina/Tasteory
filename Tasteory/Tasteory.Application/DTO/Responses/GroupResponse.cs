namespace Application.DTO.Responses;

public record GroupResponse(
    Guid Id, 
    string Name, 
    string InviteCode, 
    string OwnerName, 
    int MembersCount);