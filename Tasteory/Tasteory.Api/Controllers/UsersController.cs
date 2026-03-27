using Microsoft.AspNetCore.Mvc;
using Tasteory.Api.DTOs;

namespace Tasteory.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    [HttpGet("me")]
    public ActionResult<UserResponse> GetMe()
    {
        var mockUser = new UserResponse(
            Guid.Parse("7b2184f4-5263-4b5b-9d62-793547900f68"), 
            "dima@tasteory.com", 
            "Дмитрий"
        );

        return Ok(mockUser);
    }

    [HttpPut("me")]
    public ActionResult<UserResponse> UpdateMe([FromBody] UpdateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Имя не может быть пустым" });

        var updatedUser = new UserResponse(
            Guid.Parse("7b2184f4-5263-4b5b-9d62-793547900f68"), 
            "dima@tasteory.com", 
            request.Name
        );

        return Ok(updatedUser);
    }

    [HttpDelete("me")]
    public IActionResult DeleteMe()
    {
        return NoContent();
    }
    
    [HttpGet("me/groups")]
    public ActionResult<List<GroupResponse>> GetMyGroups()
    {
        var myGroups = new List<GroupResponse>
        {
            new GroupResponse(Guid.NewGuid(), "Семья Ивановых", "IVAN-123", "Таня", 4),
            new GroupResponse(Guid.NewGuid(), "Дача (Рецепты)", "GARDEN-55", "Ybrbnf", 2)
        };
        return Ok(myGroups);
    }
}