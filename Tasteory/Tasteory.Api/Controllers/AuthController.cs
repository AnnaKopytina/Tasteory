using Microsoft.AspNetCore.Mvc;
using Tasteory.Api.DTOs;

namespace Tasteory.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || request.Password.Length < 6)
            return BadRequest(new { message = "Некорректные данные или пароль слишком короткий" });

        if (request.Email == "exists@test.com")
            return Conflict(new { message = "Пользователь с таким email уже существует" });

        var response = new UserResponse(Guid.NewGuid(), request.Email, request.Name);
        
        return StatusCode(201, response); 
    }
    
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (request.Email == "error@test.com") 
            return Unauthorized(new { message = "Ошибка входа" });

        var mockToken = "super-secret-jwt-token";
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        };
        Response.Cookies.Append("tastory_token", mockToken, cookieOptions);

        var user = new UserResponse(Guid.NewGuid(), request.Email, "Дмитрий");
        return Ok(user);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("tastory_token");
        return NoContent();
    }
}