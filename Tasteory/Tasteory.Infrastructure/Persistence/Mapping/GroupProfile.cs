using AutoMapper;
using Domain.Entities;
using Domain.Models;
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
        
        CreateMap<GroupInviteEntity, GroupInvite>();

        CreateMap<UserGroupEntity, GroupMember>()
            .ForCtorParam("userId", opt => opt.MapFrom(src => src.UserId))
            .ForCtorParam("userName", opt => opt.MapFrom(src => src.User.UserName))
            .ForCtorParam("groupRole", opt => opt.MapFrom(src => src.Role));
        
        CreateMap<GroupInvite, GroupInviteEntity>();
    }
}