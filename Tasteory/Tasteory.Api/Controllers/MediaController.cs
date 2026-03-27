using Microsoft.AspNetCore.Mvc;
using Tasteory.Api.DTOs;

namespace Tasteory.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    [HttpPost("upload")]
    public async Task<ActionResult<UploadMediaResponse>> UploadPhoto(IFormFile file)
    {
        if (file == null || file.Length == 0) 
            return BadRequest("Файл не пришел");

        var extension = Path.GetExtension(file.FileName).ToLower();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        
        if (!allowedExtensions.Contains(extension))
            return BadRequest("Разрешены только изображения (jpg, png, webp)");

        var fileName = $"{Guid.NewGuid()}{extension}";
        
        // здесь путь к облаку
        var mockUrl = $"лалала/{fileName}";

        var response = new UploadMediaResponse(
            MediaId: Guid.NewGuid(),
            Url: mockUrl,
            Type: "photo"
        );

        return Created(mockUrl, response);
    }
    
    [HttpDelete("{mediaId:guid}")]
    public IActionResult DeleteMedia(Guid mediaId)
    {
        return NoContent();
    }
}