using Microsoft.AspNetCore.Mvc;
using Tasteory.Api.DTOs;

namespace Tasteory.Api.Controllers;

[ApiController]
[Route("api/groups")]
public class GroupsController : ControllerBase
{
    [HttpPost]
    public ActionResult<GroupResponse> Create([FromBody] CreateGroupRequest request)
    {
        var response = new GroupResponse(
            Id: Guid.NewGuid(),
            Name: request.Name,
            InviteCode: "MAMA-PAPA-123",
            OwnerName: "Счастливого тебе рефакторинга Никита! =)",
            MembersCount: 1
        );
        return StatusCode(201, response);
    }

    [HttpGet("{id:guid}")]
    public ActionResult<GroupResponse> GetById(Guid id)
    {
        if (id == Guid.Empty) return NotFound();
        
        return Ok(new GroupResponse(id, "Семья Ивановых", "IVAN-CODE", "Аня", 3));
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] UpdateGroupRequest request)
    {
        return Ok(new { message = "Название группы обновлено", newName = request.Name });
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        return NoContent();
    }

    [HttpPost("join")]
    public IActionResult Join([FromBody] JoinGroupRequest request)
    {
        if (request.InviteCode == "ALREADY_IN") 
            return Conflict(new { message = "Вы уже состоите в этой группе" });
        
        if (request.InviteCode == "WRONG") 
            return NotFound(new { message = "Группа с таким кодом не найдена" });

        return Ok(new { message = "Добро пожаловать в семью!" });
    }

    [HttpGet("{id:guid}/recipes")]
    public ActionResult<List<RecipeResponse>> GetGroupRecipes(Guid id)
    {
        return Ok(new List<object> { new { title = "Семейный пирог", id = Guid.NewGuid() } });
    }

    [HttpPost("{id:guid}/recipes")]
    public IActionResult AddRecipeToGroup(Guid id, [FromBody] Guid recipeId)
    {
        return StatusCode(201, new { message = "Рецепт теперь доступен всей семье" });
    }

    [HttpGet("{id:guid}/members")]
    public ActionResult<List<GroupMemberResponse>> GetMembers(Guid id)
    {
        var members = new List<GroupMemberResponse>
        {
            new GroupMemberResponse("Воландеморт", "Owner"),
            new GroupMemberResponse("Гари", "Member"),
            new GroupMemberResponse("Драко", "Member")
        };
        return Ok(members);
    }

    [HttpDelete("{id:guid}/members/me")]
    public IActionResult LeaveGroup(Guid id)
    {
        return NoContent();
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public IActionResult KickMember(Guid id, Guid userId)
    {
        return NoContent();
    }
}