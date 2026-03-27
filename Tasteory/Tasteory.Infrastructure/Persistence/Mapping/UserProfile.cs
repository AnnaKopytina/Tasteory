using AutoMapper;
using Domain.Entities;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<UserEntity, User>();
        CreateMap<User, UserEntity>();
    }
}