using Application.DTO.Requests;
using Application.DTO.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/notes")]
public class NotesController : ControllerBase
{
    [HttpGet("step/{stepId:guid}")]
    public ActionResult<StepNotesResponse> GetNotesByStep(Guid stepId)
    {
        var response = new StepNotesResponse(
            StepId: stepId,
            MyPrivateNote: "Моя секретная заметка про волосы",
            FamilyNote: "Общий совет: не сжечь кухню"
        );
        return Ok(response);
    }
    
    [HttpPut]
    public IActionResult SaveNote([FromBody] UpdateNoteRequest request)
    {
        if (request.StepId == Guid.Empty)
            return BadRequest("StepId обязателен");
        
        return Ok(new { 
            message = request.IsPrivate ? "Личная заметка сохранена" : "Семейная заметка обновлена",
            stepId = request.StepId,
            savedText = request.Text
        });
    }
    
    [HttpDelete("step/{stepId:guid}")]
    public IActionResult DeleteNote(Guid stepId, [FromQuery] bool isPrivate)
    {
        return NoContent();
    }
}