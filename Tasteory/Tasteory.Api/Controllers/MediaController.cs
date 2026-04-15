using Application.DTO.Responses;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/media")]
[Authorize]
[RequestSizeLimit(100_000_000)] //100 MB
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<MediaUploadResponse>> Upload(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        var result = await _mediaService.UploadAsync(stream, file.FileName, file.ContentType, file.Length);

        return Ok(result);
    }

    [HttpDelete("file")]
    public async Task<IActionResult> Delete([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest("URL is required");
        }

        var storage = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
        await storage.DeleteAsync(url);

        return NoContent();
    }
}