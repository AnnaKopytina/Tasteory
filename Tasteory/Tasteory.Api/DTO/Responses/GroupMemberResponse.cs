namespace Tasteory.Api.DTOs;

public record GroupMemberResponse(
    string Name, 
    string Role); // "Owner" или "Member"