using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tasteory.Extensions;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/notes")]
[Authorize]
public class NotesController : ControllerBase
{
    private readonly INoteService _noteService;

    public NotesController(INoteService noteService)
    {
        _noteService = noteService;
    }

    [HttpGet("step/{stepId:guid}")]
    public async Task<ActionResult<StepNotesResponse>> GetNotesByStep(Guid stepId, [FromQuery] Guid? groupId)
    {
        var userId = User.GetUserId();
        var response = await _noteService.GetNotesForStepAsync(userId, stepId, groupId);
        
        return Ok(response);
    }

    [HttpPut]
    public async Task<IActionResult> SaveNote([FromBody] UpdateNoteRequest request)
    {
        var userId = User.GetUserId();
        
        await _noteService.SaveNoteAsync(userId, request);

        return Ok(new
        {
            message = request.IsPrivate ? "Personal note is saved" : "Group note is updated",
            stepId = request.StepId
        });
    }

    [HttpDelete("step/{stepId:guid}")]
    public async Task<IActionResult> DeleteNote(Guid stepId, [FromQuery] bool isPrivate, [FromQuery] Guid? groupId = null)
    {
        var userId = User.GetUserId();
        
        await _noteService.DeleteNoteAsync(userId, stepId, isPrivate, groupId);
        
        return NoContent();
    }
}