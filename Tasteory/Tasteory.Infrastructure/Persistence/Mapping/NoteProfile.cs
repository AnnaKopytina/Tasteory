using AutoMapper;
using Domain.Entities;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class NoteProfile : Profile
{
    public NoteProfile()
    {
        CreateMap<StepNoteEntity, StepNote>()
            .ForCtorParam("text", opt => opt.MapFrom(src => src.NoteText));

        CreateMap<StepNote, StepNoteEntity>()
            .ForMember(dest => dest.NoteText, opt => opt.MapFrom(src => src.Text));
    }
}