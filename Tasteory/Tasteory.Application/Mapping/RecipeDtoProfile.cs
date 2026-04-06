using Application.DTO;
using Application.DTO.Responses;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public class RecipeDtoProfile : Profile
{
    public RecipeDtoProfile()
    {
        CreateMap<Recipe, RecipeResponse>()
            .ForMember(dest => dest.AuthorName, opt => opt.Ignore());

        CreateMap<Ingredient, IngredientDto>();

        CreateMap<Step, StepDto>()
            .ForMember(dest => dest.MediaType,
                opt => opt.MapFrom(src => src.MediaType != null ? src.MediaType.ToString() : null));
    }
}