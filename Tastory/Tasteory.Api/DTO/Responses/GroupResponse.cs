namespace Tasteory.Api.DTOs;

public record GroupResponse(
    Guid Id, 
    string Name, 
    string InviteCode, 
    string OwnerName, 
    int MembersCount);