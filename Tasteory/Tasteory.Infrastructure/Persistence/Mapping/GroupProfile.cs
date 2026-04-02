using AutoMapper;
using Domain.Entities;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class GroupProfile : Profile
{
    public GroupProfile()
    {
        CreateMap<GroupEntity, Group>()
            .ForCtorParam("ownerName", opt => opt.MapFrom(src => src.Owner.UserName))
            .ForCtorParam("inviteCode", opt => opt.MapFrom(src =>
                src.Invites.FirstOrDefault() != null ? src.Invites.FirstOrDefault()!.Code : null))
            .ForCtorParam("membersCount", opt => opt.MapFrom(src => src.Users.Count));
    }
}