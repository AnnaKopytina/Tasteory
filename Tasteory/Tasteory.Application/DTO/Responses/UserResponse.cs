namespace Application.DTO.Responses;

public record UserResponse(Guid Id, string Email, string DisplayName, string Username, string? AvatarUrl);