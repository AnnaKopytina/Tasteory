using AutoMapper;
using Domain.Entities;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class UserProfile : Profile
{
    public UserProfile()
    {
        CreateMap<UserEntity, User>()
            .ForCtorParam("displayName", opt => opt.MapFrom(src => src.DisplayName))
            .ForCtorParam("username", opt => opt.MapFrom(src => src.UserName))
            .ForCtorParam("email", opt => opt.MapFrom(src => src.Email))
            .ForCtorParam("passwordHash", opt => opt.MapFrom(src => src.PasswordHash));

        CreateMap<User, UserEntity>()
            .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.DisplayName))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.PasswordHash, opt => opt.MapFrom(src => src.PasswordHash))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.AvatarUrl))
            .ForMember(dest => dest.LastActivityAt, opt => opt.MapFrom(src => src.LastActivityAt));
    }
}