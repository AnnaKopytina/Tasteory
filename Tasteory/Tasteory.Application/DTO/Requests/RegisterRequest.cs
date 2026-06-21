namespace Application.DTO.Requests;

public record RegisterRequest(string Email, string Password, string DisplayName, string Username);