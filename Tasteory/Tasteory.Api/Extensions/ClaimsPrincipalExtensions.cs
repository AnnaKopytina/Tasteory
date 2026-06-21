using System.Security.Claims;

namespace Tasteory.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var userIdStr = principal.FindFirst("userId")?.Value;

        return Guid.TryParse(userIdStr, out var userId) ? userId : Guid.Empty;
    }
}