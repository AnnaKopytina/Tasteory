using AutoMapper;
using Domain.Entities;
using Domain.Models;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class RecipeProfile : Profile
{
    public RecipeProfile()
    {
        CreateMap<Recipe, RecipeEntity>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.AuthorId, opt => opt.MapFrom(src => src.AuthorId))!
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
            .ForMember(dest => dest.Author, opt => opt.Ignore())
            .ForMember(dest => dest.Ingredients, opt => opt.Ignore())
            .ForMember(dest => dest.Steps, opt => opt.Ignore());  

        CreateMap<IngredientEntity, Ingredient>();

        CreateMap<StepEntity, Step>()
            .ForCtorParam("mediaType", opt => opt.MapFrom(src => src.MediaType));

        CreateMap<Recipe, RecipeEntity>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AuthorId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Rating, opt => opt.Ignore());

        CreateMap<Ingredient, IngredientEntity>();
        CreateMap<Step, StepEntity>();

        CreateMap<RecipeEntity, RecipeSummary>();
    }
}