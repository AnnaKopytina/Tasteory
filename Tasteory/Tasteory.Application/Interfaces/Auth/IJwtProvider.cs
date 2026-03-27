using Domain.Entities;

namespace Application.Interfaces.Auth;

public interface IJwtProvider
{
    public string Generate(User user);
}